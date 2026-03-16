
import { supabase } from '@/integrations/supabase/client';

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: 'course_release' | 'assignment' | 'enrollment' | 'grade' | 'general' = 'general'
) => {
  try {
    const { error } = await supabase.rpc('send_notification', {
      target_user_id: userId,
      notification_title: title,
      notification_message: message,
      notification_type: type
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const createCourseReleaseNotification = async (courseName: string) => {
  try {
    const { error } = await supabase.rpc('send_course_release_notifications', {
      course_name: courseName
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating course release notifications:', error);
  }
};

export const createEnrollmentWelcomeNotification = async (userId: string, courseName: string) => {
  await createNotification(
    userId,
    'Welcome to Your New Course!',
    `Congratulations! You've successfully enrolled in "${courseName}". Start your learning journey today!`,
    'enrollment'
  );
};

export const createAssignmentNotification = async (userId: string, assignmentTitle: string, courseName: string, dueDate: string) => {
  const formattedDate = new Date(dueDate).toLocaleDateString();
  await createNotification(
    userId,
    'New Assignment Available',
    `"${assignmentTitle}" has been assigned in ${courseName}. Due: ${formattedDate}`,
    'assignment'
  );
};
