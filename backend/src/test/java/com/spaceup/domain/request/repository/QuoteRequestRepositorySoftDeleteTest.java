package com.spaceup.domain.request.repository;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.data.domain.PageRequest;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberRole;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.request.entity.Property;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RequestStatus;

@DataJpaTest(properties = {
		"spring.flyway.enabled=false",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.datasource.url=jdbc:h2:mem:quote_request_soft_delete;MODE=MySQL;DB_CLOSE_DELAY=-1",
		"spring.datasource.driver-class-name=org.h2.Driver"
})
class QuoteRequestRepositorySoftDeleteTest {

	@Autowired private QuoteRequestRepository quoteRequestRepository;
	@Autowired private PropertyRepository propertyRepository;
	@Autowired private MemberRepository memberRepository;
	@Autowired private TestEntityManager entityManager;

	@Test
	void softDeletedRequestRemainsInDatabaseButDisappearsFromRepositoryQueries() {
		Member owner = memberRepository.save(Member.builder().password("encoded").email("owner@test.com")
				.name("임대인").role(MemberRole.LANDLORD).build());
		Property property = propertyRepository.save(Property.builder().owner(owner).region("광주 북구")
				.housingType("APARTMENT").exclusiveAreaM2(84.0).build());
		QuoteRequest request = quoteRequestRepository.saveAndFlush(QuoteRequest.builder().owner(owner)
				.property(property).requestCode("REQ-SOFT-DELETE").status(RequestStatus.NEW).build());
		Long requestId = request.getId();

		request.softDelete();
		quoteRequestRepository.saveAndFlush(request);
		entityManager.clear();

		assertThat(quoteRequestRepository.findById(requestId)).isEmpty();
		assertThat(quoteRequestRepository.findByOwnerId(owner.getId(), PageRequest.of(0, 20))).isEmpty();
		Number physicalRows = (Number) entityManager.getEntityManager()
				.createNativeQuery("select count(*) from quote_request where request_id = :id")
				.setParameter("id", requestId).getSingleResult();
		assertThat(physicalRows.longValue()).isEqualTo(1L);
	}
}
