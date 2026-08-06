package com.spaceup.domain.request.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.request.entity.RequestImage;
import com.spaceup.domain.request.entity.RequestImageType;

@Repository
public interface RequestImageRepository extends JpaRepository<RequestImage, Long> {

	List<RequestImage> findByRequestIdOrderByImageTypeAscSortOrderAsc(Long requestId);

	List<RequestImage> findByRequestIdAndImageTypeOrderBySortOrderAsc(Long requestId, RequestImageType imageType);

	int countByRequestIdAndImageType(Long requestId, RequestImageType imageType);
}
