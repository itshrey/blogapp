import React, { useState, useEffect } from 'react';
import { Alert, Button, FileInput, Select, TextInput, Spinner, Badge } from 'flowbite-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaImage, FaUpload, FaTimes } from 'react-icons/fa';

export default function CreatePost() {
    const navigate = useNavigate();
    const { currentUser } = useSelector(state => state.user);
    const [file, setFile] = useState(null);
    const [imageUploadProgress, setImageUploadProgress] = useState(null);
    const [imageUploadError, setImageUploadError] = useState(null);
    const [formData, setFormData] = useState({});
    const [publishError, setPublishError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [wordCount, setWordCount] = useState(0);

    // Check if user is verified or admin
    const canCreatePost = currentUser?.isAdmin || currentUser?.isVerified;

    useEffect(() => {
        if (!canCreatePost) {
            navigate('/dashboard?tab=profile');
            return;
        }
    }, [canCreatePost, navigate]);

    const handleImageUpload = async () => {
        try {
            if (!file) {
                setImageUploadError('Please select an image');
                return;
            }
            
            setImageUploadError(null);
            const storage = getStorage(app);
            const fileName = new Date().getTime() + '-' + file.name;
            const storageRef = ref(storage, fileName);
            const uploadTask = uploadBytesResumable(storageRef, file);
            
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setImageUploadProgress(progress.toFixed(0));
                },
                (error) => {
                    setImageUploadError('Image upload failed (2MB max)');
                    setImageUploadProgress(null);
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        setImageUploadError(null);
                        setImageUploadProgress(null);
                        setFormData({ ...formData, image: downloadURL });
                    });
                }
            );
        } catch (error) {
            setImageUploadError('Image upload failed');
            setImageUploadProgress(null);
            console.error('Upload error:', error);
        }
    };

    const handleContentChange = (content) => {
        setFormData({ ...formData, content });
        // Simple word count (split by spaces and filter out empty strings)
        const words = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(word => word.length > 0);
        setWordCount(words.length);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setPublishError(null);

        // Trim and validate inputs
        const title = formData.title?.trim();
        const content = formData.content?.trim();
        const category = formData.category || 'uncategorized';

        if (!title || !content) {
            setPublishError("Title and content are required");
            setIsSubmitting(false);
            return;
        }

        if (title.length < 5 || title.length > 100) {
            setPublishError("Title must be between 5-100 characters");
            setIsSubmitting(false);
            return;
        }

        if (wordCount < 50) {
            setPublishError("Content should be at least 50 words");
            setIsSubmitting(false);
            return;
        }

        try {
            const res = await fetch('/api/post/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ 
                    ...formData, 
                    title,
                    content,
                    category
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to create post");
            }

            navigate(`/post/${data.post.slug}`);
        } catch (error) {
            console.error('Post creation error:', error);
            setPublishError(error.message || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!canCreatePost) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Alert color="failure" className="max-w-md">
                    You need to be a verified user or admin to create posts.
                </Alert>
            </div>
        );
    }

    return (
        <div className='p-3 max-w-4xl mx-auto min-h-screen'>
            <h1 className='text-center text-3xl my-7 font-semibold'>Create a Post</h1>
            
            <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
                <div className='flex flex-col gap-4 sm:flex-row justify-between'>
                    <TextInput 
                        type='text' 
                        placeholder='Enter post title...' 
                        required 
                        id='title'
                        className='flex-1' 
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        minLength="5"
                        maxLength="100"
                    />
                    <Select 
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        defaultValue="uncategorized"
                    >
                        <option value='uncategorized'>Select a category</option>
                        <option value='reactjs'>React.js</option>
                        <option value='nextjs'>Next.js</option>
                        <option value='javascript'>JavaScript</option>
                        <option value='programming'>Programming</option>
                        <option value='technology'>Technology</option>
                        <option value='politics'>Politics</option>
                        <option value='sports'>Sports</option>
                        <option value='entertainment'>Entertainment</option>
                    </Select>
                </div>

                <div className='flex flex-col gap-4 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg'>
                    <div className='flex items-center gap-4'>
                        <FileInput 
                            id="image-upload"
                            accept='image/*' 
                            onChange={(e) => setFile(e.target.files[0])}
                            className="w-full"
                            icon={FaImage}
                        />
                        <Button 
                            type='button' 
                            gradientDuoTone='purpleToBlue' 
                            size='sm' 
                            outline 
                            onClick={handleImageUpload} 
                            disabled={imageUploadProgress}
                            className="flex items-center gap-2"
                        >
                            {imageUploadProgress ? (
                                <div className='w-6 h-6'>
                                    <CircularProgressbar 
                                        value={imageUploadProgress} 
                                        text={`${imageUploadProgress}%`} 
                                        styles={{
                                            path: {
                                                stroke: `rgba(99, 102, 241, ${imageUploadProgress / 100})`,
                                            },
                                            text: {
                                                fill: '#4B5563',
                                                fontSize: '24px',
                                            },
                                        }}
                                    />
                                </div>
                            ) : (
                                <>
                                    <FaUpload /> Upload
                                </>
                            )}
                        </Button>
                    </div>

                    {file && !formData.image && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <span>{file.name}</span>
                            <button 
                                onClick={() => {
                                    setFile(null);
                                    setImageUploadProgress(null);
                                }}
                                className="text-red-500"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    )}

                    {imageUploadError && (
                        <Alert color='failure' className='mt-2'>
                            {imageUploadError}
                        </Alert>
                    )}

                    {formData.image && (
                        <div className="relative group">
                            <img 
                                src={formData.image} 
                                alt="Upload preview" 
                                className='w-full h-72 object-cover rounded-lg shadow-md'
                            />
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, image: null})}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <ReactQuill 
                        theme='snow' 
                        placeholder='Write your post content here...' 
                        className='h-72 mb-12' 
                        required 
                        onChange={handleContentChange}
                        modules={{
                            toolbar: [
                                [{ 'header': [1, 2, 3, false] }],
                                ['bold', 'italic', 'underline', 'strike'],
                                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                ['link', 'image'],
                                ['clean']
                            ]
                        }}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
                        {wordCount} words {wordCount < 50 && "(minimum 50 required)"}
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <Button 
                        type='submit' 
                        gradientDuoTone='purpleToPink'
                        disabled={isSubmitting}
                        className="flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner size="sm" />
                                Publishing...
                            </>
                        ) : 'Publish Post'}
                    </Button>

                    {currentUser?.isAdmin && (
                        <Badge color="indigo" className="ml-2">
                            Admin Post
                        </Badge>
                    )}
                </div>

                {publishError && (
                    <Alert color='failure' className='mt-4'>
                        {publishError}
                    </Alert>
                )}
            </form>
        </div>
    );
}