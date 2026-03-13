package com.example.ad_click_aggregator.function;

import com.example.ad_click_aggregator.entity.UserClickRateEntity;
import com.example.ad_click_aggregator.pojo.AdClick;

import org.apache.flink.streaming.api.functions.windowing.ProcessWindowFunction;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;

import java.time.Instant;

public class UserClickRateWindowFunction
        extends ProcessWindowFunction<AdClick, UserClickRateEntity, String, TimeWindow> {

    @Override
    public void process(String userId,
            Context context,
            Iterable<AdClick> elements,
            Collector<UserClickRateEntity> out) {

        long count = 0;
        double totalCost = 0;

        for (AdClick click : elements) {
            count++;
            totalCost += click.getCost();
        }

        UserClickRateEntity rate = new UserClickRateEntity();
        rate.setUserId(userId);
        rate.setWindowStart(Instant.ofEpochMilli(context.window().getStart()));
        rate.setWindowEnd(Instant.ofEpochMilli(context.window().getEnd()));
        rate.setClicks(count);
        rate.setTotalCost(totalCost);

        System.out.println("[Flink] User click rate: " + rate);

        out.collect(rate);
    }
}
