package com.vighnesh.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import com.vighnesh.model.Order;
import com.vighnesh.model.OrderItem;
import com.vighnesh.response.PaymentResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PaymentServiceImpl implements PaymentService{

    @Value("${stripe.api.key}")
    private String stripeSecretKey;

    @Value("${stripe.currency:usd}")
    private String currency;

    @Value("${stripe.min-amount:50}")
    private long minAmountSmallestUnit;

    @Override
    public PaymentResponse createPaymentLink(Order order) throws StripeException {
        Stripe.apiKey=stripeSecretKey;

        Long totalPrice = order.getTotalPrice();
        if (totalPrice == null || totalPrice <= 0L) {
            throw new IllegalArgumentException("Order totalPrice is null or zero; cannot create payment for amount 0");
        }
        long totalAmountSmallest = totalPrice * 100L; // assumes 2-decimal currency
        if (totalAmountSmallest < minAmountSmallestUnit) {
            throw new IllegalArgumentException("Amount too small for Stripe payments: " + totalAmountSmallest + " (min="+minAmountSmallestUnit+")");
        }

        SessionCreateParams.Builder builder = SessionCreateParams.builder()
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl("http://localhost:3000/payment/success/"+order.getId())
                .setCancelUrl("http://localhost:3000/payment/fail");

        List<OrderItem> items = order.getItems();
        boolean usePerItem = false;
        if (items != null && !items.isEmpty()) {
            long computedSum = 0L;
            List<SessionCreateParams.LineItem> tempLines = new ArrayList<>();
            for (OrderItem oi : items) {
                if (oi == null) continue;
                int qty = oi.getQuantity();
                if (qty <= 0) continue;
                Long unit = oi.getPrice();
                if (unit == null || unit <= 0) {
                    // derive unit from totalPrice if possible
                    if (oi.getTotalPrice() != null && oi.getTotalPrice() > 0 && qty > 0) {
                        long derived = oi.getTotalPrice() / qty;
                        if (derived > 0) unit = derived;
                    }
                }
                if (unit == null || unit <= 0) continue; // skip invalid item
                long lineTotal = unit * qty;
                computedSum += lineTotal;
                long unitSmallest = unit * 100L;
                String name = oi.getName() != null ? oi.getName() : (oi.getFood()!=null ? oi.getFood().getName() : ("Item #"+oi.getId()));
                SessionCreateParams.LineItem line = SessionCreateParams.LineItem.builder()
                        .setQuantity((long) qty)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency(currency)
                                .setUnitAmount(unitSmallest)
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName(name)
                                        .build())
                                .build())
                        .build();
                tempLines.add(line);
            }
            if (!tempLines.isEmpty() && computedSum > 0 && Math.abs(computedSum - totalPrice) <= 1) {
                // totals match (allowing small rounding diff) -> use per-item lines
                usePerItem = true;
                for (SessionCreateParams.LineItem li : tempLines) {
                    builder.addLineItem(li);
                }
            }
        }

        if (!usePerItem) {
            builder.addLineItem(SessionCreateParams.LineItem.builder()
                    .setQuantity(1L)
                    .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                            .setCurrency(currency)
                            .setUnitAmount(totalAmountSmallest)
                            .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                    .setName("FEASTO FOOD - Order #" + order.getId())
                                    .build())
                            .build())
                    .build());
        }

        SessionCreateParams params = builder.build();
        Session session=Session.create(params);
        PaymentResponse res = new PaymentResponse();
        res.setPayment_url(session.getUrl());
        return res;
    }

}
