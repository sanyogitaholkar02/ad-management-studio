package com.example.ad_processor.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.ad_processor.entity.ClickEvent;

@Repository
public interface ClickEventRepo extends JpaRepository<ClickEvent, Long> {

}
