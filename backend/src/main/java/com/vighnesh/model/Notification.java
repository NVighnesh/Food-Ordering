package com.vighnesh.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne
    private User user;

    private String title;

    @Column(length = 2000)
    private String body;

    private String type;

    @Column(length = 2000)
    private String data;

    // renamed from `read` to isRead and mapped to is_read column to avoid SQL reserved word conflicts
    @Column(name = "is_read")
    private boolean isRead = false;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist(){
        createdAt = LocalDateTime.now();
    }
}
