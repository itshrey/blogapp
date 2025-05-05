import React, { useEffect, useState } from 'react';
import { Alert, Button, FileInput, Select, TextInput, Spinner } from 'flowbite-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '../firebase';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaTimes } from 'react-icons/fa';

export default function UpdatePost() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.user);
    const [file, setFile] = useState(null);
    const [imageUploadProgress, setImageUploadProgress] = useState(null);
    const [imageUploadError, setImageUploadError] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        category: 'uncategorized',
        content: '',
        image: ''
    });
    const [publishError, setPublishError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [wordCount, setWordCount] = useState(0);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/post/getposts?postId=${postId}`);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Failed to fetch post');
                }

                if (!data.posts.length) {
                    navigate('/404');
                    return;
                }

                const post = data.posts[0];
                
                // Check if current user is the author or admin
                if (post.userId._id !== currentUser._id && !currentUser.isAdmin) {
                    navigate('/dashboard?tab=posts');
                    return;
                }

                setFormData({
                    title: post.title,
                    category: post.category,
                    content: post.content,
                    image: post.image
                });

                // Calculate initial word count
                const words = post.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(word => word.length > 0);
                setWordCount(words.length);
            } catch (error) {
                setPublishError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (postId) fetchPost();
    }, [postId, currentUser, navigate]);

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
                    console.error('Upload error:', error);
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
        setPublishError(null);

        // Validate inputs
        const title = formData.title?.trim();
        const content = formData.content?.trim();
        const category = formData.category || 'uncategorized';

        if (!title || !content) {
            return setPublishError("Title and content are required");
        }

        if (title.length < 5 || title.length > 100) {
            return setPublishError("Title must be between 5-100 characters");
        }

        if (wordCount < 50) {
            return setPublishError("Content should be at least 50 words");
        }

        try {
            setLoading(true);
            const res = await fetch(`/api/post/update/${postId}/${currentUser._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    credentials: 'include',
                },
                body: JSON.stringify({ 
                    title, 
                    content, 
                    category,
                    image: formData.image 
                }),
            });

            const data = await res.json();
            console.log(data);

            if (!res.ok) {
                throw new Error(data.message || "Failed to update post");
            }

            navigate(`/post/${data.post.slug}`);
        } catch (error) {
            setPublishError(error.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner size="xl" />
            </div>
        );
    }

    return (
        <div className='p-3 max-w-4xl mx-auto min-h-screen'>
            <h1 className='text-center text-3xl my-7 font-semibold'>Update Post</h1>
            
            <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
                <div className='flex flex-col gap-4 sm:flex-row justify-between'>
                    <TextInput 
                        type='text' 
                        placeholder='Title' 
                        required 
                        id='title'
                        className='flex-1' 
                        onChange={(e) => setFormData({...formData, title: e.target.value})} 
                        value={formData.title}
                        minLength="5"
                        maxLength="100"
                    />
                    <Select 
                        onChange={(e) => setFormData({...formData, category: e.target.value})} 
                        value={formData.category}
                    >
                        <option value='uncategorized'>Uncategorized</option>
                        <option value='reactjs'>React.js</option>
                        <option value='nextjs'>Next.js</option>
                        <option value='javascript'>JavaScript</option>
                        <option value='politics'>Politics</option>
                        <option value='cricket'>Cricket</option>
                        <option value='movies'>Movies</option>
                    </Select>
                </div>

                <div className='flex flex-col gap-4 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg'>
                    <div className='flex items-center gap-4'>
                        <FileInput 
                            id="image-upload"
                            accept='image/*' 
                            onChange={(e) => setFile(e.target.files[0])}
                            className="w-full"
                        />
                        <Button 
                            type='button' 
                            gradientDuoTone='purpleToBlue' 
                            size='sm' 
                            outline 
                            onClick={handleImageUpload} 
                            disabled={imageUploadProgress}
                        >
                            {imageUploadProgress ? (
                                <div className='w-6 h-6'>
                                    <CircularProgressbar 
                                        value={imageUploadProgress} 
                                        text={`${imageUploadProgress}%`} 
                                    />
                                </div>
                            ) : 'Upload Image'}
                        </Button>
                    </div>

                    {imageUploadError && (
                        <Alert color='failure' className='mt-2'>
                            {imageUploadError}
                        </Alert>
                    )}

                    {formData.image && (
                        <div className="relative group">
                            <img 
                                src={formData.image} 
                                alt="Current post" 
                                className='w-full h-72 object-cover rounded-lg'
                            />
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, image: ''})}
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
                        value={formData.content}
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

                <Button 
                    type='submit' 
                    gradientDuoTone='purpleToPink'
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Spinner size="sm" />
                            <span className="ml-2">Updating...</span>
                        </>
                    ) : 'Update Post'}
                </Button>

                {publishError && (
                    <Alert color='failure' className='mt-4'>
                        {publishError}
                    </Alert>
                )}
            </form>
        </div>
    );
}