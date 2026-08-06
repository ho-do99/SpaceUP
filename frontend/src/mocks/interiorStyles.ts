import marbleStyleImage from '@/assets/user/images/style-marble.png'
import modernStyleImage from '@/assets/user/images/style-modern.png'
import whiteStyleImage from '@/assets/user/images/style-white.png'
import woodStyleImage from '@/assets/user/images/style-wood.png'

export type InteriorStyleId = 'modern' | 'wood' | 'white' | 'marble'

export interface InteriorStyleOption {
  id: InteriorStyleId
  name: string
  description: string
  imageSrc: string
  imageAlt: string
}

export const interiorStyleOptions: ReadonlyArray<InteriorStyleOption> = [
  {
    id: 'modern',
    name: '모던',
    description: '깔끔한 선과 차분한 색감',
    imageSrc: modernStyleImage,
    imageAlt: '모던 인테리어 스타일 예시',
  },
  {
    id: 'wood',
    name: '우드',
    description: '따뜻하고 자연스러운 분위기',
    imageSrc: woodStyleImage,
    imageAlt: '우드 인테리어 스타일 예시',
  },
  {
    id: 'white',
    name: '화이트',
    description: '밝고 넓어 보이는 공간',
    imageSrc: whiteStyleImage,
    imageAlt: '화이트 인테리어 스타일 예시',
  },
  {
    id: 'marble',
    name: '대리석',
    description: '고급스럽고 세련된 분위기',
    imageSrc: marbleStyleImage,
    imageAlt: '대리석 인테리어 스타일 예시',
  },
]
