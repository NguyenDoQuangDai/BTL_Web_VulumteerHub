package org.volumteerhub.dto;

import lombok.Builder;
import lombok.Data;
import org.springframework.hateoas.server.core.Relation;
import org.volumteerhub.common.enumeration.UserRole;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@Relation(collectionRelation = "users")
public class UserResponse {
    private UUID id;
    private String firstname;
    private String lastname;
    private String username;
    private UserRole role;
    private Boolean isActive;
    private Instant createdAt;
}
