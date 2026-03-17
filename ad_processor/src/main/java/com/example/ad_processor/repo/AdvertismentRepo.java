package com.example.ad_processor.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.ad_processor.entity.Ads;
import com.example.ad_processor.pojo.Advertisments;

@Repository
public interface AdvertismentRepo extends JpaRepository<Ads, Long> {

    List<Advertisments> save(List<Advertisments> advertismentsList);

    Ads findByAdID(String adID);

}
