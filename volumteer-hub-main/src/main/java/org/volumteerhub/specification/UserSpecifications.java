package org.volumteerhub.specification;

import org.springframework.data.jpa.domain.Specification;
import org.volumteerhub.common.enumeration.UserRole;
import org.volumteerhub.model.User;

public class UserSpecifications {

    public static Specification<User> hasRole(UserRole role) {
        return (root, query, cb) -> role == null ? null : cb.equal(root.get("role"), role);
    }

    public static Specification<User> isActive(Boolean isActive) {
        return (root, query, cb) -> isActive == null ? null : cb.equal(root.get("isActive"), isActive);
    }

    public static Specification<User> usernameContains(String username) {
        return (root, query, cb) -> (username == null || username.isEmpty())
                ? null
                : cb.like(cb.lower(root.get("username")), "%" + username.toLowerCase() + "%");
    }
}
