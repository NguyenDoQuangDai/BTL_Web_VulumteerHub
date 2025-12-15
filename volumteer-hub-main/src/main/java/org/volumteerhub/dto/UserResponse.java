package org.volumteerhub.dto;

import lombok.Builder;
import lombok.Data;
import org.volumteerhub.common.enumeration.UserRole;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private String firstname;
    private String lastname;
    private String username;
    private UserRole role;
    private Instant createdAt;
}
