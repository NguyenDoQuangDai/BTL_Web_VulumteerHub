package org.volumteerhub.dto;

import lombok.Data;

@Data
public class MessageResponse implements ApiResponse {
    private String message;

    public MessageResponse(String message) {
        this.message = message;
    }
}
