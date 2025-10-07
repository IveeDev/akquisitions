import { db } from "#config/database.js";
import logger from "#config/logger.js";
import { users } from "#models/user.model.js";

export const getAllUsers = async () => {
  try {
    return await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users);
  } catch (error) {
    logger.error("Error fetching all users", error);
    throw error;
  }
};

export const getUserById = async id => {
  try {
    const [user] = await db
      .select({
        id: user.id,
        email: user.id,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) throw new Error("User not found!");
  } catch (error) {
    logger.error(`Error getting user by Id ${id}:`, error);
    throw error;
  }
};

export const updateUser = async (id, updates) => {
  try {
    // First check if user exists
    const existingUser = await getUserById(id);

    // Check if email is being updated and if it already exists
    if (updates.email && updates.email !== existingUser.email) {
      const [emailExists] = await db
        .select()
        .from(users)
        .where(eq(users.email, updates.email))
        .limit(1);

      if (emailExists) {
        throw new Error("Email already exists!");
      }
    }

    // Add updated_at timestamp
    const updatedData = {
      ...updates,
      updated_at: new Date(),
    };

    const [updatedUser] = await db
      .update(users)
      .set(updatedData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    logger.info(`User ${updatedUser.email} updated successfully`);
    return updatedUser;
  } catch (error) {
    logger.error(`Error updating user ${id}:`, error);
    throw error;
  }
};

export const deleteUser = async id => {
  try {
    // First check if user exists
    await getUserById(id);

    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ email: users.email, name: users.name, role: users.role });

    logger.info(`User ${deletedUser.email} deleted successfully`);
    return deletedUser;
  } catch (error) {
    logger.error(`Error deleting user ${id}:`, error);
    throw error;
  }
};
