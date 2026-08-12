package com.spaceup.domain.rental.client;

import java.io.StringReader;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;

import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import com.spaceup.domain.rental.exception.RentalApiException;

@Component
public class MolitRentalXmlParser {

	public MolitRentalPage parse(String xml) {
		try {
			Document document = newSecureFactory()
					.newDocumentBuilder()
					.parse(new InputSource(new StringReader(xml)));

			String resultCode = text(document, "resultCode");
			String resultMessage = text(document, "resultMsg");
			if (!"000".equals(resultCode)) {
				throw new RentalApiException(
						"국토교통부 API 오류 [" + resultCode + "]: " + resultMessage);
			}

			return new MolitRentalPage(
					integer(document, "pageNo"),
					integer(document, "numOfRows"),
					integer(document, "totalCount"),
					items(document));
		} catch (RentalApiException e) {
			throw e;
		} catch (Exception e) {
			throw new RentalApiException(
					"국토교통부 전월세 XML 응답을 파싱할 수 없습니다.", e);
		}
	}

	private DocumentBuilderFactory newSecureFactory() throws Exception {
		DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
		factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
		factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
		factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
		factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
		factory.setXIncludeAware(false);
		factory.setExpandEntityReferences(false);
		return factory;
	}

	private List<MolitRentalItem> items(Document document) {
		NodeList itemNodes = document.getElementsByTagName("item");
		List<MolitRentalItem> items = new ArrayList<>(itemNodes.getLength());

		for (int index = 0; index < itemNodes.getLength(); index++) {
			Node itemNode = itemNodes.item(index);
			Map<String, String> fields = new LinkedHashMap<>();
			NodeList children = itemNode.getChildNodes();

			for (int childIndex = 0; childIndex < children.getLength(); childIndex++) {
				Node child = children.item(childIndex);
				if (child.getNodeType() == Node.ELEMENT_NODE) {
					fields.put(child.getNodeName(), child.getTextContent().trim());
				}
			}
			items.add(new MolitRentalItem(fields));
		}
		return items;
	}

	private int integer(Document document, String tagName) {
		return Integer.parseInt(text(document, tagName));
	}

	private String text(Document document, String tagName) {
		NodeList nodes = document.getElementsByTagName(tagName);
		if (nodes.getLength() == 0) {
			throw new RentalApiException(
					"국토교통부 API 응답에 " + tagName + " 값이 없습니다.");
		}
		Node node = nodes.item(0);
		if (node instanceof Element element) {
			return element.getTextContent().trim();
		}
		return node.getTextContent().trim();
	}
}
