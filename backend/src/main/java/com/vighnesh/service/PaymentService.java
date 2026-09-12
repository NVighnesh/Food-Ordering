package com.vighnesh.service;

import com.stripe.exception.StripeException;
import com.vighnesh.model.Order;
import com.vighnesh.response.PaymentResponse;

public interface PaymentService {

    public PaymentResponse createPaymentLink(Order order) throws StripeException;
}
