package com.vighnesh.controller;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationCreateRequest {
    private String title;
    private String body;
    private String type;
    private String data; // JSON blob stored as string in DB
}

