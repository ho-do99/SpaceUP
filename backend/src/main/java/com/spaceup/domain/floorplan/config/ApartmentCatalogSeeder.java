package com.spaceup.domain.floorplan.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import com.spaceup.domain.floorplan.entity.Apartment;
import com.spaceup.domain.floorplan.entity.FloorPlanVariant;
import com.spaceup.domain.floorplan.repository.ApartmentRepository;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] "아파트/평면도 검색" 화면이 실제로 결과를 보여줄 수 있도록, local/dev 프로필로 기동할 때
// 카탈로그가 비어 있으면 샘플 데이터를 채워 넣습니다. 이미 데이터가 있으면(재기동 등) 아무 것도 하지 않습니다.
//
// ⭐ 앞의 3곳(상무센트럴/상무리버뷰/상무스카이)은 frontend/src/mocks/apartments.ts의 목업과 이름·주소·면적
// 구성(59/74/84㎡)을 그대로 맞췄습니다 - 실 연동 시 화면이 이미 봐온 데이터와 자연스럽게 이어지도록 하기 위함.
// 나머지는 지역 필터가 실제로 여러 지역에서 동작하는지 보여주기 위한 추가 샘플입니다.
@Configuration
@Profile({ "local", "dev" })
@RequiredArgsConstructor
public class ApartmentCatalogSeeder {

	private final ApartmentRepository apartmentRepository;

	@Bean
	public CommandLineRunner seedApartments() {
		return args -> {
			if (apartmentRepository.count() > 0) {
				return;
			}

			// ⭐ frontend/src/mocks/apartments.ts와 동일한 3곳 + 동일한 59/74/84㎡ 구성
			Variant[] standardVariants = { new Variant(59.0, 84.0, "기본형", 2), new Variant(74.0, 99.0, "기본형", 3),
					new Variant(84.0, 112.0, "기본형", 3) };
			seed("상무센트럴아파트", "광주광역시 서구 상무중앙로 100", "광주광역시 서구 치평동 1234", "광주 서구", standardVariants);
			seed("상무리버뷰아파트", "광주광역시 서구 상무대로 200", "광주광역시 서구 쌍촌동 567", "광주 서구", standardVariants);
			seed("상무스카이아파트", "광주광역시 서구 시청로 50", "광주광역시 서구 치평동 890", "광주 서구", standardVariants);

			seed("광주센트럴자이", "광주광역시 북구 문흥로 123", "광주광역시 북구 문흥동 45", "광주 북구", new Variant(59.0, 84.0, "기본형", 2),
					new Variant(84.0, 109.0, "기본형", 3));
			seed("봉선한신휴플러스", "광주광역시 남구 봉선로 88", "광주광역시 남구 봉선동 88", "광주 남구", new Variant(84.0, 108.0, "기본형", 3),
					new Variant(114.0, 145.0, "펜트하우스형", 4));
			seed("고덕그라시움", "서울특별시 강동구 고덕로 300", "서울특별시 강동구 고덕동 300", "서울 강동구",
					new Variant(59.0, 82.0, "기본형", 2), new Variant(84.0, 112.0, "기본형", 3));
			seed("마포한강푸르지오", "서울특별시 마포구 토정로 51", "서울특별시 마포구 합정동 51", "서울 마포구",
					new Variant(59.0, 84.0, "기본형", 2), new Variant(84.0, 110.0, "테라스형", 3));
		};
	}

	private void seed(String name, String roadAddress, String lotAddress, String region, Variant... variants) {
		Apartment apartment = Apartment.builder().name(name).roadAddress(roadAddress).lotAddress(lotAddress)
				.region(region).build();
		for (Variant v : variants) {
			apartment.addVariant(FloorPlanVariant.builder().exclusiveAreaM2(v.exclusiveAreaM2)
					.supplyAreaM2(v.supplyAreaM2).typeLabel(v.typeLabel).roomCount(v.roomCount).build());
		}
		apartmentRepository.save(apartment);
	}

	private record Variant(double exclusiveAreaM2, double supplyAreaM2, String typeLabel, int roomCount) {
	}
}
