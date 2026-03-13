package com.example.ad_click_aggregator.function;

import com.example.ad_click_aggregator.entity.AdAggregateEntity;
import com.example.ad_click_aggregator.pojo.AdClick;

import org.apache.flink.streaming.api.functions.windowing.ProcessWindowFunction;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;

import java.time.Instant;

/**
 * Flink window function that aggregates AdClick events into AdAggregateEntity.
 * Groups clicks by adId_campaignId key and computes total clicks and revenue
 * per window.
 */
public class AdClickAggregateWindowFunction
        extends ProcessWindowFunction<AdClick, AdAggregateEntity, String, TimeWindow> {

    @Override
    public void process(String key,
            Context context,
            Iterable<AdClick> elements,
            Collector<AdAggregateEntity> out) {

        long count = 0;
        double revenue = 0;

        for (AdClick click : elements) {
            count++;
            revenue += click.getCost();
        }

        String[] parts = key.split("_", 2);

        AdAggregateEntity agg = new AdAggregateEntity();
        agg.setWindowStart(Instant.ofEpochMilli(context.window().getStart()));
        agg.setAdId(parts[0]);
        agg.setCampaignId(parts.length > 1 ? parts[1] : "unknown");
        agg.setClicks(count);
        agg.setRevenue(revenue);

        System.out.println("[Flink] Window aggregate: adId=" + agg.getAdId()
                + " clicks=" + count + " revenue=" + revenue);

        out.collect(agg);
    }
}
