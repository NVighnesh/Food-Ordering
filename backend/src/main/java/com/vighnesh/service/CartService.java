package com.vighnesh.service;

import com.vighnesh.model.Cart;
import com.vighnesh.model.CartItem;
import com.vighnesh.request.AddCardItemRequest;

public interface CartService {

    public CartItem addItemToCart(AddCardItemRequest req, String jwt) throws Exception;

    public CartItem updateCartItemQuantity(Long cartItemId,int quantity)throws Exception;

    public Cart removeItemFromCart(Long cartItemId,String jwt)throws Exception;

    public Long calculateCartTotals(Cart cart) throws Exception;

    public Cart findCartById(Long id) throws Exception;
    public Cart findCartByUserId(Long userId) throws Exception;
    public Cart clearCart(Long userId) throws Exception;

}
