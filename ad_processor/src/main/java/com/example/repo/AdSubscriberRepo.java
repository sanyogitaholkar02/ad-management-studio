package com.example.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.entity.AdSubscriber;

@Repository
public interface AdSubscriberRepo extends JpaRepository<AdSubscriber, Long> {

    AdSubscriber findByAdIdAndUserId(String adId, String userId);

    List<AdSubscriber> findByAdId(String adId);

}
