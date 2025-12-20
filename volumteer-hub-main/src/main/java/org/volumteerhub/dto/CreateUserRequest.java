package org.volumteerhub.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.volumteerhub.common.validation.OnCreate;
import org.volumteerhub.common.validation.OnUpdate;

@Data
public class CreateUserRequest {

    @NotBlank(message = "Firstname is required", groups = {OnCreate.class, OnUpdate.class})
    private String firstname;

    @NotBlank(message = "Lastname is required", groups = {OnCreate.class, OnUpdate.class})
    private String lastname;

    @NotBlank(message = "Username is required", groups = {OnCreate.class})
    @Size(min = 4, max = 50, message = "Username must be between 4 and 50 characters", groups = {OnCreate.class})
    private String username;

    @NotBlank(message = "Email is required", groups = {OnCreate.class})
    @Email(message = "Invalid email format", groups = {OnCreate.class, OnUpdate.class})
    private String email; // Added email field

    @NotBlank(message = "Password is required", groups = {OnCreate.class})
    @Size(min = 6, message = "Password must be at least 6 characters", groups = {OnCreate.class, OnUpdate.class})
    private String password;
}
