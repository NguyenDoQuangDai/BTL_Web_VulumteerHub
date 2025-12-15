package org.volumteerhub.dto;

import lombok.Data;

@Data
public class LoginResponse implements ApiResponse {
    private String token;
    private String username;

    public LoginResponse(String token, String username) {
        this.token = token;
        this.username = username;
    }
}
