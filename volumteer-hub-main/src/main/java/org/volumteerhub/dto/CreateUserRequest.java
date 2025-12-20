package org.volumteerhub.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.volumteerhub.common.validation.OnCreate;

@Data
public class CreateUserRequest {
    @NotBlank(groups = OnCreate.class)
    private String firstname;

    @NotBlank(groups = OnCreate.class)
    private String lastname;

    @NotBlank(groups = OnCreate.class)
    private String username;

    @NotBlank(groups = OnCreate.class)
    private String password;
}
