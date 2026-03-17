package com.example.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.entity.Ads;

@Repository
public interface AdvertismentRepo extends JpaRepository<Ads, Long> {

    List<com.example.pojo.Advertisments> save(List<com.example.pojo.Advertisments> advertismentsList);

    Ads findByAdID(String adID);

}
