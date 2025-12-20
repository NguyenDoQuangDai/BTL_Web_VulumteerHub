import { API_ENDPOINTS, apiRequest } from '../config/api';

// Authentication Service
export const authService = {
  login: async (username, password) => {
    try {
      const response = await apiRequest(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        // Construct user object if not provided directly
        const userObj = response.user || (response.username ? { 
          username: response.username,
          role: response.role || (Array.isArray(response.roles) ? response.roles[0] : response.roles) || 'Tình nguyện viên',
          id: response.id,
          fullName: response.fullName,
          avatar: response.avatar,
          createdAt: response.createdAt || response.registrationDate || new Date().toISOString()
        } : null);

        if (userObj) {
          localStorage.setItem('user', JSON.stringify(userObj));
        } else {
          localStorage.removeItem('user');
        }
        return { ...response, user: userObj };
      }
      return response || {};
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      // Clean up bad value and return null
      localStorage.removeItem('user');
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

// Event Service
export const eventService = {
  // Get all events with pagination and filters
  getEvents: async (page = 0, size = 20, status = null, search = null, sort = null, ownerId = null) => {
    try {
      let url = `${API_ENDPOINTS.EVENTS.LIST}?page=${page}&size=${size}`;
      
      if (status) {
        url += `&status=${status}`;
      }
      
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      if (sort) {
        url += `&sort=${sort}`;
      }

      if (ownerId) {
        url += `&ownerId=${ownerId}`;
      }
      
      const response = await apiRequest(url);
      
      // Handle Spring Boot pagination response
      if (response._embedded && response._embedded.events) {
        return {
          events: response._embedded.events,
          totalElements: response.page.totalElements,
          totalPages: response.page.totalPages,
          currentPage: response.page.number,
        };
      }
      
      return {
        events: response.content || [],
        totalElements: response.totalElements || 0,
        totalPages: response.totalPages || 0,
        currentPage: response.number || 0,
      };
    } catch (error) {
      console.error('Error fetching events:', error);
      return { events: [], totalElements: 0, totalPages: 0, currentPage: 0 };
    }
  },

  // Get single event by ID
  getEvent: async (id) => {
    return await apiRequest(API_ENDPOINTS.EVENTS.GET(id));
  },

  // Create new event
  createEvent: async (eventData) => {
    return await apiRequest(API_ENDPOINTS.EVENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  // Update event
  updateEvent: async (id, eventData) => {
    return await apiRequest(API_ENDPOINTS.EVENTS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(eventData),
    });
  },

  // Delete event
  deleteEvent: async (id) => {
    return await apiRequest(API_ENDPOINTS.EVENTS.DELETE(id), {
      method: 'DELETE',
    });
  },

  // Submit event for approval
  submitEvent: async (id) => {
    return await apiRequest(API_ENDPOINTS.EVENTS.SUBMIT(id), {
      method: 'POST',
    });
  },
};

// Registration Service
export const registrationService = {
  // Get user's registrations
  getUserRegistrations: async () => {
    return await apiRequest(API_ENDPOINTS.REGISTRATIONS.LIST);
  },

  // Register for an event
  registerForEvent: async (eventId, message = '') => {
    return await apiRequest(API_ENDPOINTS.REGISTRATIONS.CREATE(eventId), {
      method: 'POST',
      // Backend doesn't expect body for join, but we can send it if needed later. 
      // Current controller signature is joinEvent(@PathVariable UUID eventId)
      // so body is ignored.
    });
  },

  // Get registration by ID
  getRegistration: async (id) => {
    return await apiRequest(API_ENDPOINTS.REGISTRATIONS.GET(id));
  },

  // Get registrations by event ID
  getRegistrationsByEvent: async (eventId, status = null) => {
    let url = `${API_ENDPOINTS.REGISTRATIONS.LIST}?eventId=${eventId}`;
    if (status) {
      url += `&status=${status}`;
    }
    const response = await apiRequest(url);
    
    if (response._embedded && response._embedded.registrations) {
      return response._embedded.registrations;
    }
    return [];
  },

  // Approve registration
  approveRegistration: async (id) => {
    return await apiRequest(API_ENDPOINTS.REGISTRATIONS.APPROVE(id), {
      method: 'POST',
    });
  },

  // Reject registration
  rejectRegistration: async (id) => {
    return await apiRequest(API_ENDPOINTS.REGISTRATIONS.REJECT(id), {
      method: 'POST',
    });
  },

  // Delete registration
  deleteRegistration: async (id) => {
    return await apiRequest(API_ENDPOINTS.REGISTRATIONS.DELETE(id), {
      method: 'DELETE',
    });
  },
};

// User Service
export const userService = {
  // Get all users (admin only)
  getUsers: async () => {
    return await apiRequest(API_ENDPOINTS.USERS.LIST);
  },

  // Get user by ID
  getUser: async (id) => {
    return await apiRequest(API_ENDPOINTS.USERS.GET(id));
  },

  getMyself: async () => {
    return await apiRequest(API_ENDPOINTS.USERS.MYSELF);
  },

  updateUser: async (userId, userData) => {
    return apiRequest(API_ENDPOINTS.USERS.UPDATE(userId), {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },

  // Create new user
  createUser: async (userData) => {
    return await apiRequest(API_ENDPOINTS.USERS.CREATE, {
      method: 'POST',
      body: JSON.stringify({
        firstname: userData.firstname,
        lastname: userData.lastname,
        username: userData.username,
        email: userData.email,
        password: userData.password
      }),
    });
  },

  // Update user
  updateUser: async (id, userData) => {
    return await apiRequest(API_ENDPOINTS.USERS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
};

// Admin Service (Requires ADMIN role)
export const adminService = {
  // Approve event
  approveEvent: async (eventId) => {
    try {
      return await apiRequest(API_ENDPOINTS.ADMIN.APPROVE_EVENT(eventId), {
        method: 'POST',
      });
    } catch (error) {
      if (error.message.includes('FORBIDDEN')) {
        throw new Error('Access denied. Admin privileges required.');
      }
      throw error;
    }
  },

  // Reject event
  rejectEvent: async (eventId) => {
    try {
      return await apiRequest(API_ENDPOINTS.ADMIN.REJECT_EVENT(eventId), {
        method: 'POST',
      });
    } catch (error) {
      if (error.message.includes('FORBIDDEN')) {
        throw new Error('Access denied. Admin privileges required.');
      }
      throw error;
    }
  },

  // Test admin access
  testAccess: async () => {
    try {
      return await apiRequest(API_ENDPOINTS.ADMIN.TEST);
    } catch (error) {
      if (error.message.includes('FORBIDDEN')) {
        throw new Error('Access denied. Admin privileges required.');
      }
      throw error;
    }
  },

  // Debug admin access
  debugAccess: async () => {
    try {
      return await apiRequest(API_ENDPOINTS.ADMIN.DEBUG);
    } catch (error) {
      if (error.message.includes('FORBIDDEN')) {
        throw new Error('Access denied. Admin privileges required.');
      }
      throw error;
    }
  },

  // Get all events (for admin dashboard)
  getAllEvents: async () => {
    try {
      // Use the general events endpoint which allows admins to see all events
      // Request a large size to get all events since pagination isn't implemented in the admin UI yet
      const response = await apiRequest(`${API_ENDPOINTS.EVENTS.LIST}?size=1000`);
      
      if (!response) return [];
      if (response._embedded && response._embedded.events) {
        return response._embedded.events;
      }
      return response.content || (Array.isArray(response) ? response : []);
    } catch (error) {
      if (error.message.includes('FORBIDDEN')) {
        throw new Error('Access denied. Admin privileges required.');
      }
      throw error;
    }
  },

  // Get all registrations (for admin dashboard)
  getAllRegistrations: async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.ADMIN.GET_ALL_REGISTRATIONS);
      if (response._embedded && response._embedded.registrations) {
        return response._embedded.registrations;
      }
      return response.content || [];
    } catch (error) {
      if (error.message.includes('FORBIDDEN')) {
        throw new Error('Access denied. Admin privileges required.');
      }
      throw error;
    }
  },
};

// Post Service
export const postService = {
  // Lấy tất cả bài viết (Global Forum)
  getAllPosts: async (page = 0, size = 20) => {
    return await apiRequest(`${API_ENDPOINTS.POSTS.LIST_ALL}?page=${page}&size=${size}&sort=createdAt,desc`);
  },
  // Lấy danh sách bài viết theo sự kiện
  getPostsByEvent: async (eventId, page = 0, size = 20, type = null) => {
    let url = `${API_ENDPOINTS.EVENTS.GET(eventId)}/posts?page=${page}&size=${size}`;
    if (type) {
        url += `&type=${type}`;
    }
    return await apiRequest(url);
  },
  // Tạo bài viết mới
  createPost: async (eventId, postData) => {
    const url = `${API_ENDPOINTS.EVENTS.GET(eventId)}/posts`;
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },
  // Sửa bài viết
  updatePost: async (postId, postData) => {
    return await apiRequest(API_ENDPOINTS.POSTS.UPDATE(postId), {
      method: 'PATCH',
      body: JSON.stringify(postData),
    });
  },
  // Xóa bài viết
  deletePost: async (postId) => {
    return await apiRequest(API_ENDPOINTS.POSTS.DELETE(postId), {
      method: 'DELETE',
    });
  },
  // Thích bài viết
  likePost: async (postId) => {
    return await apiRequest(API_ENDPOINTS.POSTS.REACT(postId, 'LIKE'), {
      method: 'POST',
    });
  },
  // Bỏ thích bài viết
  unlikePost: async (postId) => {
    return await apiRequest(API_ENDPOINTS.POSTS.REACT(postId, 'NONE'), {
      method: 'POST',
    });
  },
  // Lấy danh sách bình luận
  getComments: async (postId, page = 0, size = 20) => {
    return await apiRequest(`${API_ENDPOINTS.COMMENTS.LIST_BY_POST(postId)}?page=${page}&size=${size}`);
  },
  // Tạo bình luận
  createComment: async (postId, content, parentId = null) => {
    return await apiRequest(API_ENDPOINTS.COMMENTS.CREATE(postId), {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
  },
  // Xóa bình luận
  deleteComment: async (commentId) => {
    return await apiRequest(API_ENDPOINTS.COMMENTS.DELETE(commentId), {
      method: 'DELETE',
    });
  },
};