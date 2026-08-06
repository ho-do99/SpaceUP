import cv2
import json
import fastwer
import logging
import numpy as np
import pandas as pd
import re
import yaml
import warnings
from pathlib import Path
from tqdm import tqdm

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision.models import resnet18


warnings.filterwarnings(action='ignore')

# logger instance 생성
logger = logging.getLogger("OCR")

# formatter 생성
formatter = logging.Formatter('[%(asctime)s][%(levelname)s|%(filename)s] %(message)s')

# handler 생성 (stream, file)
streamHandler = logging.StreamHandler()
fileHandler = logging.FileHandler('./OCREvaluation.log')

# logger instance에 fomatter 설정
streamHandler.setFormatter(formatter)
fileHandler.setFormatter(formatter)

# logger instance에 handler 설정
logger.addHandler(streamHandler)
logger.addHandler(fileHandler)

logger.setLevel(level=logging.INFO)


class CRNN(nn.Module):
    
    def __init__(self, num_chars, resnet, rnn_hidden_size=256, dropout=0.1):
        
        super(CRNN, self).__init__()
        self.num_chars = num_chars
        self.rnn_hidden_size = rnn_hidden_size
        self.dropout = dropout
        
        # CNN Part 1
        resnet_modules = list(resnet.children())[:-3]
        self.cnn_p1 = nn.Sequential(*resnet_modules)
        
        # CNN Part 2
        self.cnn_p2 = nn.Sequential(
            nn.Conv2d(256, 256, kernel_size=(3,6), stride=1, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True)
        )
        self.linear1 = nn.Linear(1024, 256)
        
        # RNN
        self.rnn1 = nn.GRU(input_size=rnn_hidden_size, 
                            hidden_size=rnn_hidden_size,
                            bidirectional=True, 
                            batch_first=True)
        self.rnn2 = nn.GRU(input_size=rnn_hidden_size, 
                            hidden_size=rnn_hidden_size,
                            bidirectional=True, 
                            batch_first=True)
        self.linear2 = nn.Linear(self.rnn_hidden_size*2, num_chars)
        
        
    def forward(self, batch):        
        batch = self.cnn_p1(batch)        
        batch = self.cnn_p2(batch) # [batch_size, channels, height, width]        
        batch = batch.permute(0, 3, 1, 2) # [batch_size, width, channels, height]         
        batch_size = batch.size(0)
        T = batch.size(1)
        batch = batch.view(batch_size, T, -1) # [batch_size, T==width, num_features==channels*height]
        batch = self.linear1(batch)        
        batch, hidden = self.rnn1(batch)
        feature_size = batch.size(2)
        batch = batch[:, :, :feature_size//2] + batch[:, :, feature_size//2:]        
        batch, hidden = self.rnn2(batch)        
        batch = self.linear2(batch)        
        batch = batch.permute(1, 0, 2) # [T==10, batch_size, num_classes==num_features]
        return batch
    
    
def decode_predictions(text_batch_logits, idx2char):
    text_batch_tokens = F.softmax(text_batch_logits, 2).argmax(2) # [T, batch_size]
    text_batch_tokens = text_batch_tokens.numpy().T # [batch_size, T]

    text_batch_tokens_new = []
    for text_tokens in text_batch_tokens:
        text = [idx2char[idx] for idx in text_tokens]
        text = "".join(text)
        text_batch_tokens_new.append(text)

    return text_batch_tokens_new


def remove_duplicates(text):
    if len(text) > 1:
        letters = [text[0]] + [letter for idx, letter in enumerate(text[1:], start=1) if text[idx] != text[idx-1]]
    elif len(text) == 1:
        letters = [text[0]]
    else:
        return ""
    return "".join(letters)


def correct_prediction(word, remove_word='갱'):
    parts = word.split("-")
    parts = [remove_duplicates(part) for part in parts]
    corrected_word = "".join(parts)
    corrected_word = corrected_word.replace(remove_word,'')
    return corrected_word


def correct_word(word):
    word = re.sub('\s', '', word)
    word = re.sub('^ELEH홀$|^ELEV홀$|^ELE홀$|^ELV홀$|^ELV\\.홀$|^ELEV\\.홀$|^EL홀$|^ELE홀$|^ELEV홀$|^다LV홀$|^ELE.홀$|^ELEV.L$|^ELEV\.\.$', 'ELEV.홀', word)
    word = re.sub('^ELEHAL$|^ELE\\.HAL$|^ELE\\.HAL$|^ELE\\.AL$|^ELEHL$|^ELEVHAL$|^ELEHAL$|^ELE.HALL$|^ELE.HL$|^EEV\./?스+$|^E\.H대스$|^EL.V크$', 'ELEV.HALL', word)
    word = re.sub('^ELEV\s도$|^ELE\s?도$|^ELE\s?홀$|^ELE홀$|^ELV홀$|^ELEV도$', 'ELEV.복도', word)
    word = re.sub('^가스룸$', '가스배관', word)
    word = re.sub('^[계|거|기][족|욕]실$', '가족실', word)
    word = re.sub('^가족부욕실$', '가족욕실', word)
    word = re.sub('^거구실$|^거단실$', '거실', word)
    word = re.sub('^거\w{2,}실$', '거실/침실', word)
    word = re.sub('^\w스룸$', '게스트룸', word)
    word = re.sub('^발용욕실$|^공욕실$|^공용실$', '공용욕실', word)
    word = re.sub('^기본더형$|^기공방$|^기본?실$|^기형$|^거형$|^기당$|^가\s?당$|^드형$|^평룸$', '기본형', word)
    word = re.sub('^다가스룸$', '다가구주택', word)
    word = re.sub('^다스$', '다락', word)
    word = re.sub('^다공방$', '다락방', word)
    word = re.sub('^다용실$|^다도실$', '다용도실', word)
    word = re.sub('^단위기니$|^단[위|외|코]대$|^단위실$|^발위대$|^단세대$|^발코대$|^단대$|^축대$', '단위세대', word)
    word = re.sub('^대피.*$|^대.*간$', '대피공간', word)
    word = re.sub('^주마당$|^옥당$', '뒷마당', word)
    word = re.sub('^드스+$', '드레', word)
    word = re.sub('^드레스스$|^드레스$|^드스룸$|^드레룸$', '드레스룸', word)
    word = re.sub('^펜인관$|^하인관$', '메인현관', word)
    word = re.sub('^발코.*$|^발/?기.*$|^발코/?스기?실$|^발코/?식실$|^발코스식기실$|^발코외스기$|^발코니[기|니|스|실|/]+$|^발코스니$|^발코/실$|^발코[스|식|실]+$|^발외니$|^부코[니|실]$|^실외니$|^발실$', '발코니', word)
    word = re.sub('^발니$|^니$', '방', word)
    word = re.sub('^보일니$|^부일니$|^보니$|^보일$', '보일러', word)
    word = re.sub('^부일러실$|^보일실$|^도러실$|^도라실$', '보일러실', word)
    word = re.sub('^보레스주방$|^보조[스|주]+방$|^보레스방$', '보조주방', word)
    word = re.sub('^부욕실$|^부부실$|^부실$', '부부욕실', word)
    word = re.sub('^부러실$', '부부침실', word)
    word = re.sub('^스당$', '식당', word)
    word = re.sub('^실기$', '실외기', word)
    word = re.sub('^기외기실$|^기피기실$|^실외실$|^부기실$|^실기실$', '실외기실', word)
    word = re.sub('^안실$|^안니$|^안코$', '안방', word)
    word = re.sub('^알파공?실$|^알파간$|^알파실$', '알파공간', word)
    word = re.sub('^욕니$|^화실$', '욕실', word)
    word = re.sub('^계녀방$|^주녀방$|^지당$', '자녀방', word)
    word = re.sub('^주및$', '주방및', word)
    word = re.sub('^주및식당$', '주방및식당', word)
    word = re.sub('^주방/식식당$|^주/식당$|^주방/?당$|^주식당$|^주방당$', '주방/식당', word)
    word = re.sub('^확장장$|^주장$', '주차장', word)
    word = re.sub('^주장형$', '주출입구', word)
    word = re.sub('^침고$', '창고', word)
    word = re.sub('^축당$|^욕척$|^축실$', '축척', word)
    word = re.sub('^침관$', '침실', word)
    word = re.sub('^테라[식|니|기]{1,2}$|^테스$|^테\w스$', '테라스', word)
    word = re.sub('^파우더실$|^파우룸$|^펜트룸$', '파우더룸', word)
    word = re.sub('^평면도[실|식]$|^평면도+$|^평면[실|니]$|^평[도|실|니]$|^평도[도|실]$|^평면$', '평면도', word)
    word = re.sub('^하향식난구$|^하향식피구$|^하향식입구$|^하향\w{2,}$', '하향식피난구', word)
    word = re.sub('^욕장실$', '화장실', word)
    word = re.sub('^화장방$|^화방$|^확형$|^확장$|^욕형$', '확장형', word)
    word = re.sub('^현[실|식]$|^현관.*$', '현관', word)
    return word


def calculate_iou(bboxes1, bboxes2):
    x11, y11, x12, y12 = np.split(bboxes1, 4, axis=1)
    x21, y21, x22, y22 = np.split(bboxes2, 4, axis=1)
    xA = np.maximum(x11, np.transpose(x21))
    yA = np.maximum(y11, np.transpose(y21))
    xB = np.minimum(x12, np.transpose(x22))
    yB = np.minimum(y12, np.transpose(y22))
    interArea = np.maximum((xB - xA + 1), 0) * np.maximum((yB - yA + 1), 0)
    boxAArea = (x12 - x11 + 1) * (y12 - y11 + 1)
    boxBArea = (x22 - x21 + 1) * (y22 - y21 + 1)
    iou = interArea / (boxAArea + np.transpose(boxBArea) - interArea)
    return iou


def make_crnn_input(sample_pt, rgb_img):
    base_img = np.ones((60,250,3), dtype=int)*255

    ix1 = np.clip(sample_pt[0]-5, 0, 4960)
    iy1 = np.clip(sample_pt[1]-5, 0, 3488)
    ix2 = np.clip(sample_pt[2]+5,0,4960)
    iy2 = np.clip(sample_pt[3]+5, 0, 3488)

    height = np.clip(iy2 - iy1, 0, 60)
    width = np.clip(ix2 - ix1, 0, 250)

    top = np.round((60 - height) / 2).astype(int)

    base_img[top:top+height, 0:width, :] = rgb_img[iy1:iy2, ix1:ix2, :][:60,:250,:]
    input_tensor = torch.from_numpy(base_img.transpose(2,0,1) / 255).type(torch.FloatTensor).unsqueeze(0)
    
    return base_img, input_tensor


def load_img(img_path, ctype, mtype):
    img     = cv2.imread(str(img_path), cv2.IMREAD_COLOR) #, flags=cv2.IMREAD_REDUCED_COLOR_8
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    bh, bw = rgb_img.shape[:2]
    yolo_input_img = rgb_img[:bh // 32 * 32,:bw // 32 * 32,:]
    if ctype == 'APT' and mtype =='CS':
        # 이미지 90도 회전
        yolo_input_img = cv2.rotate(yolo_input_img, cv2.ROTATE_90_CLOCKWISE)
    return yolo_input_img


def yolo_crnn_predict(yolov5, crnn, device, idx2char, yolo_input_img, undetect_df):
    result = yolov5(yolo_input_img, size=4960).pandas().xyxy[0]
    result[['xmin', 'ymin', 'xmax', 'ymax']] = result[['xmin', 'ymin', 'xmax', 'ymax']].apply(np.ceil).astype(int)
    
    ocr_results = []
    for bbox in result[['xmin', 'ymin', 'xmax', 'ymax']].values:
        input_img, input_tensor = make_crnn_input(bbox, yolo_input_img)
        text_batch_logits = crnn(input_tensor.to(device)) # [T, batch_size, num_classes==num_features]
        text_batch_pred = decode_predictions(text_batch_logits.cpu(), idx2char)
        pred_word = correct_prediction(text_batch_pred[0])
        coreected_pred_word = correct_word(pred_word)
        ocr_results.append(coreected_pred_word)

    result['OCR'] = ocr_results
    # for undetected bounding boxes
    result = pd.concat((undetect_df, result), ignore_index=True)
    return result


def load_label(lbl_path):
    with lbl_path.open('r', encoding='utf-8') as f:
        json_data = json.load(f)
        
    gt_bboxes = []
    gt_labels = []
    for ele in json_data['annotations']:
        gt_bbox = ele['bbox']
        ocr_label = ele['attributes']['OCR']
        gt_bboxes.append(gt_bbox)
        gt_labels.append(ocr_label)
    gt_bboxes = np.array(gt_bboxes)
    gt_bboxes[:,2] += gt_bboxes[:,0]
    gt_bboxes[:,3] += gt_bboxes[:,1]
    # gt_labels = np.array(gt_labels)
    gt_dict = {
        'boxes':np.round(gt_bboxes).astype(int),
        'labels':gt_labels
    }
    return gt_dict


def caluculate_iou(result, gt_dict, ctype, mtype):
    bboxes = result[['xmin', 'ymin', 'xmax', 'ymax']].values
    if ctype == 'APT' and mtype =='CS':
        # 90도 돌아간 라벨 복원
        new_bboxes = np.vstack([bboxes[:,1], 3488 - bboxes[:,2], bboxes[:,3], 3488 - bboxes[:,0]]).T
        new_bboxes = np.round(new_bboxes).astype(int)
        result[['xmin', 'ymin', 'xmax', 'ymax']] = new_bboxes
        iou_matrix = calculate_iou(new_bboxes, gt_dict['boxes'])
    else:
        iou_matrix = calculate_iou(bboxes, gt_dict['boxes'])

    non_predict_indices = np.where(~iou_matrix.any(axis=0))[0]
    return result, iou_matrix, non_predict_indices


def calculate_cer(result, gt_dict, iou_matrix, non_predict_indices, serial):
    cer_list = []
    for i, idx in enumerate(np.argmax(iou_matrix, axis=0)):
        inner_dict = dict()
        ocr_gt = gt_dict['labels'][i].replace(' ', '')
        if i not in non_predict_indices:
            ocr_pred = result['OCR'].values[idx]
        else:
            ocr_pred = ''
        cer_list.append(
            {
                'gt_idx'  : i,
                'ocr_gt'  : ocr_gt,
                'pred_idx': idx,
                'ocr_pred': ocr_pred,
            }
        )
    cer_df = pd.DataFrame(cer_list)
    cols = cer_df.columns.tolist()
    cer_df['file_name'] = serial    
    cer_df['cer'] = cer_df.apply(lambda x:fastwer.score_sent(x.ocr_pred, x.ocr_gt, char_level=True), axis=1)
    return cer_df[['file_name', 'gt_idx', 'ocr_gt', 'pred_idx', 'ocr_pred', 'cer']]


def run():
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    # ordered characters from crnn model training
    vocabulary = list('갱토/덱설름축자벨f펌탈밀밭A접목R즐월팬입의식매서합맘메종콘총온정채건막카뒷α판애절책점베린척측승쓰회스트나패동펜약시창방홀이붙더제면탁어례놀남랙지향층키납울악근현머엌클통필쪽응용E임물,법침당진취든살락마확소일큰대커디초신주발력범P탕강무 녀조컨속변첫게단둘니련해거파갑레리프벽냉I촌증듈좌잔늘욕S영아데도투처실계간코로별준휴링열기요농업랑탱역툇표공숙넌후원에옥테집님감부고오(육램평타장출1+튜렛캐구환송활화손V경체템)노태튼겸&위및다압암급르닥룸관포복김모삭썬젠T블보유누알함짝광각중음비한연품생H상저박플란사탑선즈라.적래픈N텔청우택외번량국인수작뜰치안천분난내예샤팅바피씽닝문벤황배루겐터재독퍼획러a림드크운뮤티할세Y등L브명잭가워행횡센전개옷습형호차풍갤하반족페톡째붕양폰미-여본민')

    idx2char = {k:v for k,v in enumerate(vocabulary, start=0)}
    # for unknown character (maybe not use)
    idx2char[len(idx2char)] = '@'
    char2idx = {v:k for k,v in idx2char.items()}

    # pretrained model path
    pretrained_crnn_path = Path('model/OCR_crnn_pretrained.pt')
    pretrained_yolov5_path = Path('model/OCR_yolov5_pretrained.pt')
    yolo_path = Path('yolov5')

    # test data path
    test_img_path = Path('datasets/image')
    test_lbl_path = Path('datasets/label')

    num_chars = len(char2idx)
    rnn_hidden_size = 256
    resnet = resnet18(pretrained=True)
    
    logger.info('Model Load')
    
    # load pretrained crnn model
    crnn = CRNN(num_chars, resnet, rnn_hidden_size=rnn_hidden_size)
    crnn.load_state_dict(torch.load(pretrained_crnn_path))
    crnn = crnn.to(device)

    # load pretrained yolo v5 model
    yolov5 = torch.hub.load(str(yolo_path), 'custom',  str(pretrained_yolov5_path), source='local', _verbose=False)
    # yolo v5 setting
    yolov5.conf = 0.4
    yolov5.iou = 0.5

    logger.info('Model Load Complete')
    
    logger.info('='*50)
    logger.info('Find Image Files')
    
    # load test data serial
    test_list = [ele.stem for ele in sorted(test_img_path.glob('*.png'))]
    
    logger.info(f'Test Image Count: {len(test_list)}')
    
    logger.info('='*50)
    logger.info('Inference Start')
    logger.info('='*50)

    # set undetected rslt dataframe
    undetect_df = pd.DataFrame(
        [{'xmin': 0,
         'ymin': 0,
         'xmax': 0,
         'ymax': 0,
         'confidence': .0,
         'class': 0,
         'name': 'OCR',
         'OCR': ''}]
    )

    # list for saving results
    full_rslt_list = []
    for serial in test_list:
        ctype, mtype, _, _ = serial.split('_')

        # image, label path
        img_path = test_img_path / f'{serial}.png'
        lbl_path = test_lbl_path / f'{serial}.json'

        # preprocessing
        yolo_input_img = load_img(img_path, ctype, mtype)

        # predict
        result = yolo_crnn_predict(yolov5, crnn, device, idx2char, yolo_input_img, undetect_df)

        # load ground truth label
        gt_dict = load_label(lbl_path)

        # evaluate
        # calculate iou
        result, iou_matrix, non_predict_indices = caluculate_iou(result, gt_dict, ctype, mtype)
        # calculate cer
        cer_df = calculate_cer(result, gt_dict, iou_matrix, non_predict_indices, serial)

        # attach bounding boxes info
        rslt_df = pd.concat(
            (
                cer_df, 
                pd.DataFrame(gt_dict['boxes'], columns=['gt_xmin', 'gt_ymin', 'gt_xmax', 'gt_ymax']), 
                result.iloc[cer_df.pred_idx.values][['xmin', 'ymin', 'xmax', 'ymax']].reset_index(drop=True)
            ), 
            axis=1
        )
        # calculate mean cer
        mean_cer = rslt_df.loc[rslt_df.ocr_gt != '', 'cer'].mean()

        # log
        gt_log = f"[{img_path.stem}.png]grdt: {'_'.join(rslt_df.loc[rslt_df.ocr_gt != '', 'ocr_gt'].values.tolist())}"
        pred_log = f"[{img_path.stem}.png]pred: {'_'.join(rslt_df.ocr_pred.values.tolist())}"
        rslt_log = f"[{img_path.stem}.png]CER mean: {mean_cer:.02f}"
        
        logger.info(gt_log)
        logger.info(pred_log)
        logger.info(rslt_log)

        # append result
        full_rslt_list.append(rslt_df)
    
    # concatenate all results
    test_fr_df = pd.concat(full_rslt_list, ignore_index=True).rename(columns={col_nm:'pred_'+col_nm for col_nm in ['xmin', 'ymin', 'xmax', 'ymax']})
    # fix rotate axis results
    test_fr_df.loc[test_fr_df.pred_idx == 0, ['pred_xmin', 'pred_ymin', 'pred_xmax', 'pred_ymax']] = 0

    final_cer_mean = test_fr_df[test_fr_df.ocr_gt != ''].cer.mean()

    logger.info('='*50)
    logger.info('Inference Finished')
    logger.info('='*50)
    logger.info(f'Final CER mean: {np.mean(final_cer_mean):.04f}')
    

if __name__ == "__main__":
    run()