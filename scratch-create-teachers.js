require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const teachers = [
  {
    full_name: "Dr. Vaniya Ahmed",
    email: "vaniya.ahmed.18@gmail.com",
    password: "password123", // Default password, they can change it later
    role: "teacher",
    intro: "Dr. Vaniya Ahmed — Chemistry Instructor (Class 9 Sindh Board) is a dedicated Chemistry educator committed to making learning simple, engaging, and concept-focused for students. Through a modern teaching approach, she simplifies complex formulas, chemical reactions, and difficult concepts into easy-to-understand lessons that help students learn with clarity and confidence. At Parhlo Pakistan, she teaches using visual glass board methodology and an exam-oriented approach designed to improve conceptual understanding, reduce learning stress, and help students perform better in Sindh Board examinations.",
    image: null
  },
  {
    full_name: "Dr. Khadija Aqeel Ahmed",
    email: "khadijaaqeelahmed20@gmail.com",
    password: "password123",
    role: "teacher",
    intro: "Dr. Khadija Aqeel — Physics Guru | Class 9 Sindh Board is a dedicated Physics educator committed to making complex scientific concepts simple, engaging, and easy to understand. Through a concept-based teaching approach and modern visual learning techniques, she helps students develop a strong foundation in Physics rather than relying on memorization. At Parhlo Pakistan, her lessons focus on concept clarity, numerical problem-solving, and exam-oriented preparation, enabling students to build confidence, improve analytical thinking, and achieve outstanding results in Sindh Board examinations.",
    image: null
  },
  {
    full_name: "M Zubair Yousif",
    email: "muhammadzubair6879@gmail.com",
    password: "password123",
    role: "teacher",
    intro: "Muhammad Zubair — English Instructor (Class 9 Sindh Board) is a passionate English educator dedicated to helping students develop strong grammar, writing, comprehension, and communication skills through a clear and concept-based teaching approach. By combining literary understanding with analytical explanation methods, he makes complex language concepts simple, engaging, and easy to grasp for students. At Parhlo Pakistan, he teaches through a structured, exam-focused methodology designed to improve concept clarity, boost confidence, and help students perform better in Sindh Board examinations while making English a more enjoyable and understandable subject.",
    image: null
  },
  {
    full_name: "Dr. M Faraz Sohail",
    email: "farazsohail18@gmail.com",
    password: "password123",
    role: "teacher",
    intro: "Dr. M. Faraz Sohail — Biology Instructor (Class 9 Sindh Board) is a concept-focused educator who combines strong academic knowledge with modern EdTech methods to make Biology simple, clear, and engaging. At Parhlo Pakistan, he teaches through visual glass board learning, using diagrams and structured explanations to build real understanding instead of memorization. His lectures are fully aligned with the Sindh Board syllabus and focus on exam preparation, including MCQs, short and long questions. With an interactive teaching style and recorded lectures for flexible learning, he helps students strengthen concepts, gain confidence, and achieve better results in their board exams. Why Learn with Dr. Faraz? With a blend of modern teaching techniques and clear communication, Dr. Faraz helps students move from confusion to clarity. His teaching is ideal for students who want to understand Biology deeply, perform confidently in exams, and learn through a smarter digital approach.",
    image: null
  }
];

async function run() {
  // 1. Fetch images from courses for these teachers
  const { data: coursesData } = await supabase.from('courses').select('instructor, instructorImage');
  
  if (coursesData) {
    for (let t of teachers) {
      // Look for a course with this instructor that has an image
      const match = coursesData.find(c => (c.instructor || '').replace(/\s+/g, ' ').trim() === t.full_name && c.instructorImage);
      if (match) {
        t.image = match.instructorImage;
      }
    }
  }

  // 2. Insert into users
  for (let t of teachers) {
    // Check if exists
    const { data: existing } = await supabase.from('users').select('id').eq('email', t.email).single();
    if (existing) {
      console.log(`Teacher ${t.email} already exists. Updating profile...`);
      const { error } = await supabase.from('users').update({
        intro: t.intro,
        image: t.image,
        full_name: t.full_name,
        role: 'teacher'
      }).eq('email', t.email);
      if (error) console.error("Error updating", t.email, error);
      else console.log(`Updated ${t.email}`);
    } else {
      console.log(`Inserting ${t.email}...`);
      const { error } = await supabase.from('users').insert([t]);
      if (error) console.error("Error inserting", t.email, error);
      else console.log(`Inserted ${t.email}`);
    }
  }

  // 3. Fix the double space in courses table for "Dr. M  Faraz Sohail"
  const { error: updateCourseError } = await supabase
    .from('courses')
    .update({ instructor: "Dr. M Faraz Sohail" })
    .eq('instructor', 'Dr. M  Faraz Sohail');
    
  if (updateCourseError) {
    console.error("Error fixing course double space:", updateCourseError);
  } else {
    console.log("Fixed double space in courses table for Dr. M Faraz Sohail (if it existed).");
  }
}

run();
