package org.volumteerhub.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class LoginResponse implements ApiResponse {
    private String token;
    private String username;
    private UUID id;
    private String role;

    public LoginResponse(String token, String username, UUID id, String role) {
        this.token = token;
        this.username = username;
        this.id = id;
        this.role = role;
    }
}
