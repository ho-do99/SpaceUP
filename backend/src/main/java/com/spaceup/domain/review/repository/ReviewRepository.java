package com.spaceup.domain.review.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.review.entity.Review;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

	boolean existsByRequestId(Long requestId);

	Optional<Review> findByRequestId(Long requestId);

	Page<Review> findByContractorIdOrderByCreatedAtDesc(Long contractorId, Pageable pageable);

	// ⭐ ContractorReviewFilter 'five'/'four' - 정확히 해당 점수인 리뷰만
	Page<Review> findByContractorIdAndRatingOrderByCreatedAtDesc(Long contractorId, int rating, Pageable pageable);

	// ⭐ ContractorReviewFilter 'three_or_less' - 3점 이하
	Page<Review> findByContractorIdAndRatingLessThanEqualOrderByCreatedAtDesc(Long contractorId, int maxRating,
			Pageable pageable);

	long countByContractorId(Long contractorId);

	long countByContractorIdAndRating(Long contractorId, int rating);

	long countByContractorIdAndRatingLessThanEqual(Long contractorId, int maxRating);

	@Query("select coalesce(avg(r.rating), 0) from Review r where r.contractor.id = :contractorId")
	double findAverageRatingByContractorId(@Param("contractorId") Long contractorId);
}
