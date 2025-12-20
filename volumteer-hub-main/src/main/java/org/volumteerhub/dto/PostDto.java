package org.volumteerhub.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.hateoas.server.core.Relation;
import org.volumteerhub.common.enumeration.PostType;
import org.volumteerhub.common.validation.OnCreate;
import org.volumteerhub.common.validation.OnUpdate;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Relation(collectionRelation = "posts")
public class PostDto {

    // Read-only
    private UUID id;
    private UUID authorId;
    private String authorName;
    private String authorRole;
    private Instant createdAt;
    private Instant updatedAt;
    private PostType type;

    // Writable
    @NotBlank(groups = {OnCreate.class, OnUpdate.class}, message = "Content cannot be empty")
    private String content;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private List<String> mediaFilenames;

    private List<String> mediaUrls;

    private long likes;
    private boolean liked;
    private Boolean pinned;
    private long commentsCount;
    
    private UUID eventId;
    private String eventName;
}
