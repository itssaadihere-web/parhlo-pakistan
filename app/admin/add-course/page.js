"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronDown, PlayCircle, Plus, X, Upload, ClipboardList, CheckCircle2, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { fetchYoutubeVideoDuration } from './actions';

const extractYouTubeId = (value) => {
  try {
    const url = new URL(value);
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.slice(1);
    }
    if (url.hostname.includes('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v) return v;
      const parts = url.pathname.split('/').filter(Boolean);
      return parts.length ? parts[parts.length - 1] : '';
    }
  } catch {
    return '';
  }
  return '';
};

export default function AdminAddCoursePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [levelDropdownOpen, setLevelDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [instructorDropdownOpen, setInstructorDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [instructorIntroMap, setInstructorIntroMap] = useState({});
  const [instructorImageMap, setInstructorImageMap] = useState({});
  const levelWrapperRef = useRef(null);
  const categoryWrapperRef = useRef(null);
  const instructorWrapperRef = useRef(null);
  const contentHeaderRef = useRef(null);
  const levelOptions = ['Basic', 'Medium', 'Advance'];
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    level: 'Basic',
    category: '',
    instructor: '',
    instructorIntro: '',
    instructorImage: '',
    thumbnail: '',
    price: '',
    discount: '',
    lectures: [
      { title: 'Demo Lecture', url: '', videoId: '', type: 'demo' },
      { title: 'Lecture 1', url: '', videoId: '', type: 'lecture' }
    ]
  });

  useEffect(() => {
    const savedDraft = window.localStorage.getItem('parhlo_course_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed && parsed.name !== undefined) {
          if (window.confirm("You have an unsaved course draft. Do you want to restore it?")) {
            setForm(parsed);
          } else {
            window.localStorage.removeItem('parhlo_course_draft');
          }
        }
      } catch (e) {}
    }
  }, []);

  const handleSaveProgress = () => {
    window.localStorage.setItem('parhlo_course_draft', JSON.stringify(form));
    alert("Course progress saved locally. You can safely leave and restore it later.");
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const admin = window.localStorage.getItem('parhloAdmin') === 'true';
    if (!admin) {
      router.replace('/');
      return;
    }
    setIsAdmin(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (contentHeaderRef.current) {
        const rect = contentHeaderRef.current.getBoundingClientRect();
        setIsSticky(rect.bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (levelWrapperRef.current && !levelWrapperRef.current.contains(event.target)) {
        setLevelDropdownOpen(false);
      }
      if (categoryWrapperRef.current && !categoryWrapperRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
      if (instructorWrapperRef.current && !instructorWrapperRef.current.contains(event.target)) {
        setInstructorDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchMetadata = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*');
      
      if (error) {
        console.error('Error fetching metadata:', error);
        return;
      }

      const categorySet = new Set();
      const instructorSet = new Set();
      const introMap = {};
      const imageMap = {};

      data.forEach((course) => {
        const category = String(course.category || '').trim();
        const instructor = String(course.instructor || '').trim();
        const intro = String(course.instructorintro || course.instructorIntro || '').trim();
        const image = String(course.instructorimage || course.instructorImage || '').trim();
        if (category) categorySet.add(category);
        
        if (instructor && intro && !introMap[instructor.toLowerCase()]) {
          introMap[instructor.toLowerCase()] = intro;
        }
        if (instructor && image && !imageMap[instructor.toLowerCase()]) {
          imageMap[instructor.toLowerCase()] = image;
        }
      });

      // Fetch official teachers from users table
      const { data: teachersData } = await supabase
        .from('users')
        .select('full_name')
        .eq('role', 'teacher');
      
      if (teachersData) {
        teachersData.forEach(t => {
          if (t.full_name) instructorSet.add(t.full_name);
        });
      }

      setCategories(Array.from(categorySet));
      setInstructors(Array.from(instructorSet));
      setInstructorIntroMap(introMap);
      setInstructorImageMap(imageMap);
    };

    fetchMetadata();
  }, []);

  useEffect(() => {
    const key = String(form.instructor || '').trim().toLowerCase();
    if (key) {
      if (instructorIntroMap[key]) {
        setForm((prev) => ({ ...prev, instructorIntro: instructorIntroMap[key] }));
      }
      if (instructorImageMap[key]) {
        setForm((prev) => ({ ...prev, instructorImage: instructorImageMap[key] }));
      }
    }
  }, [form.instructor, instructorIntroMap, instructorImageMap]);

  const slugFromName = useMemo(() => {
    return form.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }, [form.name]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, slug: slugFromName }));
  }, [slugFromName]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCurrencyInput = (field, value) => {
    const numeric = value.replace(/\D/g, '');
    if (!numeric) {
      updateField(field, '');
      return;
    }
    updateField(field, `Rs. ${Number(numeric).toLocaleString('en-US')}`);
  };

  const handleCategoryInput = (value) => {
    updateField('category', value);
    setCategoryDropdownOpen(true);
  };

  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 800; // Max dimension 800px

        if (width > height && width > max_size) {
          height = Math.round((height * max_size) / width);
          width = max_size;
        } else if (height > max_size) {
          width = Math.round((width * max_size) / height);
          height = max_size;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Export as highly compressed WebP format (0.7 quality)
        const compressedBase64 = canvas.toDataURL('image/webp', 0.7);
        callback(compressedBase64);
      };
    };
  };

  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, (compressedBase64) => {
        updateField('thumbnail', compressedBase64);
      });
    }
  };

  const handleInstructorImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, (compressedBase64) => {
        updateField('instructorImage', compressedBase64);
      });
    }
  };

  const handleInstructorInput = (value) => {
    updateField('instructor', value);
    setInstructorDropdownOpen(true);
  };

  const filteredCategories = categories
    .filter((category) => category.toLowerCase().includes(String(form.category || '').trim().toLowerCase()))
    .slice(0, 5);

  const filteredInstructors = instructors
    .filter((instructor) => instructor.toLowerCase().includes(String(form.instructor || '').trim().toLowerCase()))
    .slice(0, 5);

  const isKnownCategory = categories.some((category) => category.toLowerCase() === String(form.category || '').trim().toLowerCase());
  const isKnownInstructor = instructors.some((instructor) => instructor.toLowerCase() === String(form.instructor || '').trim().toLowerCase());

  const updateLecture = (index, field, value) => {
    setForm((prev) => {
      const lectures = [...prev.lectures];
      lectures[index] = { ...lectures[index], [field]: value };
      if (field === 'url' && lectures[index].type !== 'quiz') {
        lectures[index].videoId = extractYouTubeId(value);
      }
      return { ...prev, lectures };
    });
  };

  const handleUrlChange = async (index, value, type) => {
    updateLecture(index, 'url', value);
    if (type !== 'quiz') {
      const videoId = extractYouTubeId(value);
      if (videoId) {
        updateLecture(index, 'duration', 'Loading...');
        const duration = await fetchYoutubeVideoDuration(videoId);
        if (duration) {
          updateLecture(index, 'duration', duration);
        } else {
          updateLecture(index, 'duration', 'Unknown');
        }
      } else {
        updateLecture(index, 'duration', '');
      }
    }
  };

  const addLecture = () => {
    setForm((prev) => ({
      ...prev,
      lectures: [
        ...prev.lectures,
        {
          title: `Lecture ${prev.lectures.length + 1}`,
          url: '',
          videoId: '',
          duration: '15 min',
          type: 'lecture'
        }
      ]
    }));
  };

  const addQuiz = () => {
    setForm((prev) => ({
      ...prev,
      lectures: [
        ...prev.lectures,
        {
          title: `Quiz ${prev.lectures.length + 1}`,
          url: '',
          videoId: '',
          duration: 'Quiz',
          type: 'quiz'
        }
      ]
    }));
  };

  const removeLecture = (index) => {
    const newLectures = [...form.lectures];
    newLectures.splice(index, 1);
    setForm((prev) => ({ ...prev, lectures: newLectures }));
  };

  const moveLectureUp = (index) => {
    if (index === 0) return;
    const newLectures = [...form.lectures];
    const temp = newLectures[index - 1];
    newLectures[index - 1] = newLectures[index];
    newLectures[index] = temp;
    setForm((prev) => ({ ...prev, lectures: newLectures }));
  };

  const moveLectureDown = (index) => {
    if (index === form.lectures.length - 1) return;
    const newLectures = [...form.lectures];
    const temp = newLectures[index + 1];
    newLectures[index + 1] = newLectures[index];
    newLectures[index] = temp;
    setForm((prev) => ({ ...prev, lectures: newLectures }));
  };

  const validateForm = () => {
    if (!form.name || !form.slug || !form.description || !form.level || !form.category || !form.instructor || !form.price) {
      setError('Please fill all required course fields.');
      return false;
    }
    if (form.lectures.length < 2) {
      setError('Please add at least one demo and one lecture.');
      return false;
    }
    const brokenLecture = form.lectures.find((lecture) => !lecture.title || !lecture.url || (lecture.type !== 'quiz' && !lecture.videoId));
    if (brokenLecture) {
      setError('Please enter a valid URL for every lecture and quiz.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (event, exitAfterSave = true) => {
    if (event && event.preventDefault) event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if slug exists
      const { data: existing } = await supabase
        .from('courses')
        .select('slug')
        .eq('slug', form.slug)
        .single();

      if (existing) {
        setError('This course already exists. Change the course name so the slug is unique.');
        setLoading(false);
        return;
      }

      // Fetch instructor details from users table
      let finalInstructorIntro = form.instructorIntro;
      let finalInstructorImage = form.instructorImage;
      if (form.instructor) {
        const { data: teacherData } = await supabase
          .from('users')
          .select('intro, image')
          .eq('full_name', form.instructor)
          .eq('role', 'teacher')
          .single();
        
        if (teacherData) {
          finalInstructorIntro = teacherData.intro || '';
          finalInstructorImage = teacherData.image || '';
        }
      }

      // Insert into Supabase
      const { error: insertError } = await supabase
        .from('courses')
        .insert([
          {
            name: form.name,
            slug: form.slug,
            description: form.description,
            level: form.level,
            category: form.category,
            instructor: form.instructor,
            instructorintro: finalInstructorIntro,
            instructorimage: finalInstructorImage,
            thumbnail: form.thumbnail,
            price: form.price,
            discount: form.discount,
            lectures: form.lectures
          }
        ]);

      if (insertError) {
        const errStr = typeof insertError === 'object' ? JSON.stringify(insertError) : String(insertError);
        setError(`Failed to save course. Database Error: ${insertError.message || insertError.details || errStr}`);
        setLoading(false);
        return;
      }

      window.localStorage.removeItem('parhlo_course_draft');
      setSuccess('Course saved successfully!');
      if (exitAfterSave) {
        router.push('/admin');
      } else {
        router.push(`/admin/edit-course/${form.slug}`);
      }
    } catch (err) {
      const errString = typeof err === 'object' ? (err.message ? err.message : JSON.stringify(err)) : String(err);
      setError(`Failed to save course. Unexpected error: ${errString}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans selection:bg-green-100">
      <div className="max-w-7xl mx-auto px-8 py-10">
        <Link href="/admin" className="inline-flex items-center gap-2 mb-8 text-sm font-bold text-gray-600 hover:text-green-600">
          <ChevronLeft size={18} /> Back to Admin
        </Link>

        <div className="bg-white rounded-[2rem] border border-gray-200 p-10 shadow-sm">
          <div className="mb-10">
            <h1 className="text-4xl font-black text-slate-900 mb-3">Add New Course</h1>
            <p className="text-gray-500 max-w-2xl">Enter course details and private YouTube lecture links. Demo content is available before payment, and paid lectures will unlock after admin approval.</p>
          </div>

          <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-10">
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-gray-700">Course Name</span>
                <input
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Enter course name"
                  className="mt-3 w-full rounded-3xl border border-gray-200 bg-white px-5 py-4 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-gray-700">Slug</span>
                <input
                  value={form.slug}
                  readOnly
                  className="mt-3 w-full rounded-3xl border border-gray-200 bg-gray-100 px-5 py-4 text-gray-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-gray-700">Course Thumbnail</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleThumbnailUpload} 
                  className="hidden" 
                  id="thumbnail-upload"
                />
                <label 
                  htmlFor="thumbnail-upload"
                  className={`mt-3 flex items-center justify-center w-full rounded-3xl border-2 border-dashed p-4 cursor-pointer transition-colors overflow-hidden ${form.thumbnail ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
                >
                  {form.thumbnail ? (
                    <div className="flex flex-col items-center">
                      <CheckCircle2 size={24} className="text-green-600 mb-2"/>
                      <span className="text-green-600 font-bold text-sm">Image Uploaded</span>
                      <img src={form.thumbnail} alt="Preview" className="mt-4 h-24 object-cover rounded-lg border border-green-200" />
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm font-medium flex flex-col items-center gap-2"><Upload size={20} className="text-gray-400"/> Click to browse & upload</span>
                  )}
                </label>
              </label>
              <label className="block lg:col-span-2">
                <span className="text-sm font-bold text-gray-700">Course Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Enter a short course description"
                  rows={4}
                  className="mt-3 w-full rounded-3xl border border-gray-200 bg-white px-5 py-4 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 resize-none"
                />
              </label>
              <label className="block" ref={levelWrapperRef}>
                <span className="text-sm font-bold text-gray-700">Course Level</span>
                <div className="relative mt-3">
                  <button
                    type="button"
                    onClick={() => setLevelDropdownOpen((prev) => !prev)}
                    className="w-full rounded-[2rem] border border-green-200 bg-white px-5 py-4 pr-12 text-left text-gray-900 font-semibold shadow-sm transition duration-200 hover:border-green-300 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                  >
                    <span>{form.level}</span>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-700" />
                  </button>

                  {levelDropdownOpen && (
                    <div className="absolute left-0 right-0 z-20 mt-2 rounded-[2rem] border border-green-200 bg-white shadow-2xl">
                      <ul className="overflow-hidden rounded-[2rem]">
                        {levelOptions.map((option) => (
                          <li key={option}>
                            <button
                              type="button"
                              onClick={() => {
                                updateField('level', option);
                                setLevelDropdownOpen(false);
                              }}
                              className="w-full text-left px-5 py-4 text-gray-900 transition hover:bg-green-50 hover:text-green-700"
                            >
                              {option}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </label>
              <label className="block" ref={categoryWrapperRef}>
                <span className="text-sm font-bold text-gray-700">Category</span>
                <div className="relative mt-3">
                  <input
                    value={form.category}
                    onChange={(e) => handleCategoryInput(e.target.value)}
                    onFocus={() => setCategoryDropdownOpen(true)}
                    placeholder="Enter category"
                    className="w-full rounded-[2rem] border border-green-200 bg-white px-5 py-4 outline-none text-gray-900 shadow-sm transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                  {categoryDropdownOpen && filteredCategories.length > 0 && (
                    <div className="absolute left-0 right-0 z-20 mt-2 rounded-[2rem] border border-green-200 bg-white shadow-2xl">
                      <ul className="overflow-hidden rounded-[2rem]">
                        {filteredCategories.map((category) => (
                          <li key={category}>
                            <button
                              type="button"
                              onClick={() => {
                                updateField('category', category);
                                setCategoryDropdownOpen(false);
                              }}
                              className="w-full text-left px-5 py-4 text-gray-900 transition hover:bg-green-50 hover:text-green-700"
                            >
                              {category}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {!isKnownCategory && form.category.trim() !== '' && (
                  <p className="mt-2 text-sm text-green-700">Adding new category</p>
                )}
              </label>
              <label className="block">
                <span className="text-sm font-bold text-gray-700">Instructor Name</span>
                <div className="relative mt-3">
                  <select
                    value={form.instructor}
                    onChange={(e) => updateField('instructor', e.target.value)}
                    className="w-full rounded-[2rem] border border-green-200 bg-white px-5 py-4 pr-12 outline-none text-gray-900 shadow-sm transition focus:border-green-500 focus:ring-2 focus:ring-green-100 appearance-none"
                  >
                    <option value="" disabled>Select an instructor</option>
                    {instructors.map((instructor) => (
                      <option key={instructor} value={instructor}>{instructor}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-700 pointer-events-none" />
                </div>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-gray-700">Price</span>
                <input
                  value={form.price}
                  onChange={(e) => handleCurrencyInput('price', e.target.value)}
                  placeholder="e.g. Rs. 5,000"
                  className="mt-3 w-full rounded-3xl border border-gray-200 bg-white px-5 py-4 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-gray-700">Discount Percentage (optional)</span>
                <input
                  value={form.discount}
                  onChange={(e) => updateField('discount', e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 10"
                  className="mt-3 w-full rounded-3xl border border-gray-200 bg-white px-5 py-4 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </label>
              <div className="flex items-end justify-end gap-3 pb-1 mt-4 lg:mt-0">
                <Link href="/admin" className="inline-flex justify-center items-center rounded-full border border-gray-200 px-6 py-3.5 font-bold text-gray-600 hover:bg-gray-100 transition-all text-sm min-w-[100px]">
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={loading}
                  className="inline-flex justify-center items-center rounded-full border border-green-600 px-6 py-3.5 font-bold text-green-700 hover:bg-green-50 transition-all text-sm min-w-[100px] disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={loading}
                  className="inline-flex justify-center items-center rounded-full bg-[#064e3b] px-6 py-3.5 font-bold text-white hover:bg-green-700 transition-all text-sm min-w-[120px] disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save & Exit'}
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-gray-200 bg-gray-50 p-8">
              <div className="flex items-center justify-between mb-6" ref={contentHeaderRef}>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Content</h2>
                  <p className="text-gray-500 text-sm">Add one demo lecture plus at least one paid lecture. You can also add quizzes (Google Form links).</p>
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={addLecture}
                    className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-3 text-white font-bold hover:bg-green-700 transition-all"
                  >
                    <Plus size={16} /> Add Lecture
                  </button>
                  <button
                    type="button"
                    onClick={addQuiz}
                    className="inline-flex items-center gap-2 rounded-full border border-green-600 text-green-600 px-5 py-3 font-bold hover:bg-green-50 transition-all"
                  >
                    <Plus size={16} /> Add Quiz
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {form.lectures.map((lecture, index) => (
                  <div key={index} className="grid gap-4 md:grid-cols-12 items-end rounded-3xl border border-gray-200 bg-white p-6">
                    <div className="md:col-span-4 mt-4 md:mt-0">
                      <label className="block text-sm font-bold text-gray-700">Lecture Name</label>
                      <input
                        value={lecture.title}
                        onChange={(e) => updateLecture(index, 'title', e.target.value)}
                        placeholder={`Lecture ${index + 1} title`}
                        className="mt-3 w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      />
                    </div>
                    <div className="md:col-span-6">
                      <label className="block text-sm font-bold text-gray-700">
                        {lecture.type === 'quiz' ? 'Google Form URL' : 'YouTube URL'}
                      </label>
                      <input
                        value={lecture.url}
                        onChange={(e) => handleUrlChange(index, e.target.value, lecture.type)}
                        placeholder={lecture.type === 'quiz' ? "https://forms.gle/..." : "https://www.youtube.com/watch?v=..."}
                        className="mt-3 w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      />
                    </div>
                    <div className="md:col-span-2 flex flex-col items-end">
                      <div className="flex items-center gap-1 mb-3">
                        <button type="button" onClick={() => moveLectureUp(index)} disabled={index === 0} className={`p-1 rounded-full ${index === 0 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'} transition-colors`}>
                          <ArrowUp size={16} />
                        </button>
                        <button type="button" onClick={() => moveLectureDown(index)} disabled={index === form.lectures.length - 1} className={`p-1 rounded-full ${index === form.lectures.length - 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'} transition-colors`}>
                          <ArrowDown size={16} />
                        </button>
                        <button type="button" onClick={() => removeLecture(index)} className="p-1 rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                        {lecture.type === 'demo' ? 'Demo' : lecture.type === 'quiz' ? 'Quiz' : 'Paid'}
                      </div>
                      <div className="mt-3 text-sm text-gray-500 flex flex-col items-end gap-1">
                        <span>{lecture.type === 'quiz' ? (lecture.url ? 'Valid link' : 'Invalid URL') : (lecture.videoId ? 'Valid video' : 'Invalid URL')}</span>
                        {lecture.type !== 'quiz' && lecture.duration && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-md ${lecture.duration === 'Loading...' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                            {lecture.duration}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
            {success && <div className="rounded-3xl border border-green-200 bg-green-50 px-6 py-4 text-green-700">{success}</div>}


          </form>

          <div className="mt-14 rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-black mb-4">Secure portal preview</h3>
            <p className="text-gray-500 mb-4">Students will play your YouTube lecture content in a portal-style player without exposing the raw URL in the interface.</p>
            <div className="grid gap-6 md:grid-cols-2">
              {form.lectures.map((lecture, idx) => (
                <div key={idx} className="rounded-3xl border border-gray-200 p-4 bg-gray-50">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{lecture.title || `Lecture ${idx + 1}`}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{lecture.type === 'demo' ? 'Demo playable before payment' : lecture.type === 'quiz' ? 'Quiz link' : 'Paid lecture'}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">{lecture.type === 'demo' ? 'Demo' : lecture.type === 'quiz' ? 'Quiz' : 'Paid'}</span>
                  </div>
                  <div className="rounded-3xl border border-gray-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
                      <PlayCircle size={16} /> {lecture.type === 'quiz' ? 'Quiz Link Preview' : 'Secure player preview'}
                    </div>
                    <div className="h-48 rounded-3xl bg-black/5 overflow-hidden">
                    {lecture.type === 'quiz' ? (
                      lecture.url ? (
                        <div className="flex flex-col h-full items-center justify-center bg-green-50 text-green-700 p-4 text-center">
                          <ClipboardList size={40} className="mb-3 text-green-600" />
                          <span className="font-bold text-lg">Quiz Created</span>
                          <span className="text-xs text-green-600 mt-1 uppercase tracking-widest">Ready for students</span>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-500 text-sm">
                          Enter a valid Google Form URL
                        </div>
                      )
                    ) : lecture.videoId ? (
                      <img
                        src={`https://img.youtube.com/vi/${lecture.videoId}/hqdefault.jpg`}
                        alt="YouTube thumbnail preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-500 text-sm">
                        Enter a valid URL to preview
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Sticky Actions Bar */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl z-50 transition-all duration-300 transform ${isSticky ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0 pointer-events-none'}`}>
        <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl rounded-3xl py-3 px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700">
              <ClipboardList size={16} />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">
                {form.name ? `New Course: ${form.name}` : 'New Course'}
              </h3>
              <p className="text-xs text-gray-500 font-medium">Quick actions panel</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Subject Actions */}
            <div className="flex items-center gap-2 border-r border-gray-200 pr-3 mr-1">
              <Link href="/admin" className="inline-flex justify-center items-center rounded-full border border-gray-200 px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 transition-all text-xs">
                Cancel
              </Link>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={loading}
                className="inline-flex justify-center items-center rounded-full border border-green-600 px-4 py-2 font-bold text-green-700 hover:bg-green-50 transition-all text-xs disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="inline-flex justify-center items-center rounded-full bg-[#064e3b] px-4 py-2 font-bold text-white hover:bg-green-700 transition-all text-xs disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save & Exit'}
              </button>
            </div>
            
            {/* Content Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addLecture}
                className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-2 text-white font-bold hover:bg-green-700 transition-all text-xs"
              >
                <Plus size={14} /> Add Lecture
              </button>
              <button
                type="button"
                onClick={addQuiz}
                className="inline-flex items-center gap-1.5 rounded-full border border-green-600 text-green-600 px-4 py-2 font-bold hover:bg-green-50 transition-all text-xs"
              >
                <Plus size={14} /> Add Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
