package com.example.ad_click_aggregator.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.ad_click_aggregator.entity.AdAggregateEntity;

@Repository
public interface ClickAggregatorRepo extends JpaRepository<AdAggregateEntity, Long> {

}
