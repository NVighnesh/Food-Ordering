/**
 * Utility functions for handling common API errors
 */

export const getErrorMessage = (error) => {
  if (!error) return "An unknown error occurred";
  
  const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred";
  const errorStatus = error.response?.status;
  
  // Handle specific error types
  if (errorStatus === 400) {
    return "Invalid request. Please check your input and try again.";
  }
  
  if (errorStatus === 401) {
    return "You are not authorized to perform this action. Please log in.";
  }
  
  if (errorStatus === 403) {
    return "You don't have permission to perform this action.";
  }
  
  if (errorStatus === 404) {
    return "The requested resource was not found.";
  }
  
  if (errorStatus === 409) {
    return "This resource already exists. Please check for duplicates.";
  }
  
  if (errorStatus === 500) {
    // Handle constraint violations specifically
    if (errorMessage.includes("Duplicate entry") || errorMessage.includes("constraint")) {
      return "This item already exists in the system. Please check for duplicates.";
    }
    return "A server error occurred. Please try again later.";
  }
  
  return errorMessage;
};

export const isConstraintViolation = (error) => {
  if (!error) return false;
  
  const errorMessage = error.response?.data?.message || error.message || "";
  const errorStatus = error.response?.status;
  
  return (
    errorStatus === 500 && 
    (errorMessage.includes("Duplicate entry") || 
     errorMessage.includes("constraint") ||
     errorMessage.includes("IntegrityConstraintViolationException"))
  ) || error.isConstraintViolation === true;
};

export const getUserFriendlyErrorMessage = (error, context = "") => {
  if (isConstraintViolation(error)) {
    switch (context) {
      case "restaurant":
        return "A restaurant with this information already exists. Please check if this restaurant has been created before.";
      case "user":
        return "A user with this email already exists. Please use a different email address.";
      default:
        return "This item already exists in the system. Please check for duplicates.";
    }
  }
  
  return getErrorMessage(error);
};
