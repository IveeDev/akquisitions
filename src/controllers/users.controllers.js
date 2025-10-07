import logger from "#config/logger.js";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "#services/users.services.js";
import {
  userIdSchema,
  updateUserSchema,
} from "#validations/users.validation.js";
import { formatValidationError } from "#utils/format.js";

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info("Getting users...");
    const allUsers = await getAllUsers();
    res.json({
      message: "Successfully retrieved users",
      users: allUsers,
      count: allUsers.length,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

export const fetchUserById = async (req, res, next) => {
  try {
    logger.info(`Getting user by id: ${req.params.id}`);

    // Validate the user ID parameter
    const validationResult = userIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;
    const user = await getUserById(id);
    logger.info(`User ${user.email} retrieved successfully`);
    res.json({
      message: "User retrieved successfully",
      user,
    });
  } catch (error) {
    logger.error(`Error fetching user by id: ${e.message}`);

    if (e.message === "User not found") {
      return res.status(404).json({ error: "User not found" });
    }
    next(error);
  }
};

export const updateUserById = async (req, res, next) => {
  try {
    logger.info(`Updating user by id: ${req.params.id}`);

    const idValidationResult = userIdSchema.safeParse({ id: req.params.id });

    if (!idValidationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(idValidationResult.error),
      });
    }

    // Validate the update data
    const updateValidationResult = updateUserSchema.safeParse(req.body);

    if (!updateValidationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(updateValidationResult.error),
      });
    }

    const { id } = idValidationResult.data;
    const updates = updateValidationResult.data;

    // Authorization checks
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "You must be logged in to update user information",
      });
    }

    // Allow users to update only their own information (except role)
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({
        error: "Access denied",
        message: "You can only update your own information",
      });
    }

    // Only admin users can change roles
    if (updates.role && req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only administrators can change user roles",
      });
    }

    // Remove role from updates if non-admin user is trying to update their own profile
    if (req.user.role !== "admin") {
      delete updates.role;
    }

    const updatedUser = await updateUser(id, updates);

    logger.info(`User ${updatedUser.email} updated successfully`);
    res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    logger.error(`Error updating user: ${e.message}`);

    if (e.message === "User not found") {
      return res.status(404).json({ error: "User not found" });
    }

    if (e.message === "Email already exists") {
      return res.status(409).json({ error: "Email already exists" });
    }

    next(e);
  }
};

export const deleteUserById = async (req, res, next) => {
  try {
    logger.info(`Deleting user: ${req.params.id}`);

    // Validate the user ID parameter
    const validationResult = userIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "You must be logged in to delete a user",
      });
    }

    // Only admin users can delete users (prevent self-deletion or user deletion by non-admins)
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only administrators can delete users",
      });
    }

    // Prevent admins from deleting themselves
    if (req.user.id === id) {
      return res.status(403).json({
        error: "Operation denied",
        message: "You cannot delete your own account",
      });
    }

    const deletedUser = await deleteUser(id);
    logger.info(`User ${deletedUser.email} deleted successfully`);
    res.json({
      message: "User deleted successfully",
      user: deletedUser,
    });
  } catch (error) {
    logger.error(`Error deleting user: ${e.message}`);

    if (e.message === "User not found") {
      return res.status(404).json({ error: "User not found" });
    }

    next(e);
  }
};
