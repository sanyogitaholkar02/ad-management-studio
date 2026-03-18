package com.example.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.entity.ClickEvent;

@Repository
public interface ClickEventRepo extends JpaRepository<ClickEvent, Long> {

    List<ClickEvent> findByAdIdAndCampaignId(String adId, String campaignId);

}
