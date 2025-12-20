package org.volumteerhub.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.hateoas.server.core.Relation;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Relation(collectionRelation = "comments")
public class CommentDto {
    private UUID id;
    private UUID postId;
    private UUID parentId;
    
    private UUID userId;
    private String username;
    private String userRole;
    
    @NotBlank
    private String content;
    
    private Instant createdAt;
    private List<CommentDto> replies;
}
