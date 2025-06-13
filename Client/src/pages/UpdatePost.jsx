import React, { useEffect, useState } from 'react';
import { Alert, Button, FileInput, Select, TextInput, Spinner, Modal } from 'flowbite-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '../firebase';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaTimes, FaCheck, FaUndo } from 'react-icons/fa';

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

    // AI Enhancement States
    const [aiImproving, setAiImproving] = useState(false);
    const [aiGeneratingTitle, setAiGeneratingTitle] = useState(false);
    const [showAiPreview, setShowAiPreview] = useState(false);
    const [aiImprovedContents, setAiImprovedContents] = useState([]);
    const [selectedContentIndex, setSelectedContentIndex] = useState(0);
    const [originalContent, setOriginalContent] = useState('');
    const [showTitlePreview, setShowTitlePreview] = useState(false);
    const [aiGeneratedTitles, setAiGeneratedTitles] = useState([]);
    const [selectedTitleIndex, setSelectedTitleIndex] = useState(0);
    const [originalTitle, setOriginalTitle] = useState('');

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

    // AI Content Improvement Function
    const improveBlog = async () => {
        if (!formData.content) return;
        setAiImproving(true);
    
        try {
            // Store original content before improvement
            setOriginalContent(formData.content);
            
            const res = await fetch('/api/ai/improve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: formData.content })
            });
    
            const data = await res.json();
    
            if (!res.ok) throw new Error(data.message);
            
            // Parse the response to extract content options
            const parseAIContentResponse = (text) => {
                const contents = [];
                
                // Look for patterns like "**Option 1:**" or "**Version 1:**" followed by content
                const optionMatches = text.split(/\*\*(?:Option|Version)\s+\d+[^*]*\*\*/);
                if (optionMatches.length > 1) {
                    // Remove the first empty element and clean up each option
                    optionMatches.slice(1).forEach((match, index) => {
                        const cleaned = match.trim().replace(/^\*+\s*/, '').replace(/\*+$/, '').trim();
                        if (cleaned.length > 50) { // Only include substantial content
                            contents.push(cleaned);
                        }
                    });
                }
                
                // Fallback: look for numbered sections or bullet points
                if (contents.length === 0) {
                    const numbered = text.split(/\d+\.\s+/).filter(section => section.trim().length > 50);
                    if (numbered.length > 1) {
                        numbered.slice(1).forEach(section => {
                            const cleaned = section.trim();
                            if (cleaned.length > 50) contents.push(cleaned);
                        });
                    }
                }
                
                // Another fallback: split by double line breaks for paragraphs
                if (contents.length === 0) {
                    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 100);
                    if (paragraphs.length > 1) {
                        paragraphs.forEach(paragraph => {
                            const cleaned = paragraph.trim();
                            if (cleaned.length > 50) contents.push(cleaned);
                        });
                    }
                }
                
                // If still no options found, treat entire response as single improved version
                if (contents.length === 0) {
                    const cleaned = text.trim();
                    if (cleaned.length > 20) {
                        contents.push(cleaned);
                    }
                }
                
                return contents;
            };
            
            const contentOptions = parseAIContentResponse(data.improvedText || data.response || data.content || '');
            setAiImprovedContents(contentOptions);
            setSelectedContentIndex(0);
            setShowAiPreview(true);
        } catch (error) {
            console.error("Improve Blog Error:", error.message);
            alert("AI improvement failed. Try again later.");
        } finally {
            setAiImproving(false);
        }
    };

    const acceptAiImprovement = () => {
        const selectedContent = aiImprovedContents[selectedContentIndex];
        setFormData({ ...formData, content: selectedContent });
        // Update word count for improved content
        const words = selectedContent.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(word => word.length > 0);
        setWordCount(words.length);
        setShowAiPreview(false);
        setAiImprovedContents([]);
        setOriginalContent('');
        setSelectedContentIndex(0);
    };

    const rejectAiImprovement = () => {
        setShowAiPreview(false);
        setAiImprovedContents([]);
        setOriginalContent('');
        setSelectedContentIndex(0);
    };

    // AI Title Generation Function
    const generateTitle = async () => {
        if (!formData.content) return;
        setAiGeneratingTitle(true);
    
        try {
            // Store original title before generation
            setOriginalTitle(formData.title || '');
            
            const res = await fetch('/api/ai/improve-title', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: formData.content })
            });
    
            const data = await res.json();
    
            if (!res.ok) throw new Error(data.message);
            
            // Parse the response to extract title options
            const parseAIResponse = (text) => {
                const titles = [];
                
                // Look for patterns like "**Option 1:**" or "* " followed by title text
                const optionMatches = text.match(/\*\*Option \d+[^*]*\*\*\*?\s*([^\n*]+)/g);
                if (optionMatches) {
                    optionMatches.forEach(match => {
                        const title = match.replace(/\*\*Option \d+[^*]*\*\*\*?\s*/, '').trim();
                        if (title) titles.push(title);
                    });
                }
                
                // Fallback: look for lines starting with "* " 
                if (titles.length === 0) {
                    const bulletMatches = text.split('\n').filter(line => 
                        line.trim().startsWith('* ') && 
                        !line.includes('Option') && 
                        line.length > 10
                    );
                    bulletMatches.forEach(match => {
                        const title = match.replace(/^\s*\*\s*/, '').trim();
                        if (title) titles.push(title);
                    });
                }
                
                // If still no titles found, try to extract any meaningful lines
                if (titles.length === 0) {
                    const lines = text.split('\n').filter(line => 
                        line.trim().length > 10 && 
                        !line.includes('Here are') &&
                        !line.includes('depending on') &&
                        !line.includes('grammatical errors')
                    );
                    lines.forEach(line => {
                        const cleaned = line.replace(/[*#]/g, '').trim();
                        if (cleaned.length > 5 && cleaned.length < 100) {
                            titles.push(cleaned);
                        }
                    });
                }
                
                return titles.length > 0 ? titles : [text.trim()];
            };
            
            const titleOptions = parseAIResponse(data.title || data.response || data.text || '');
            setAiGeneratedTitles(titleOptions);
            setSelectedTitleIndex(0);
            setShowTitlePreview(true);
        } catch (error) {
            console.error("Generate Title Error:", error.message);
            alert("AI title generation failed. Try again later.");
        } finally {
            setAiGeneratingTitle(false);
        }
    };

    const acceptAiTitle = () => {
        const selectedTitle = aiGeneratedTitles[selectedTitleIndex];
        setFormData({ ...formData, title: selectedTitle });
        setShowTitlePreview(false);
        setAiGeneratedTitles([]);
        setOriginalTitle('');
        setSelectedTitleIndex(0);
    };

    const rejectAiTitle = () => {
        setShowTitlePreview(false);
        setAiGeneratedTitles([]);
        setOriginalTitle('');
        setSelectedTitleIndex(0);
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
                    <Button
                        type="button"
                        onClick={generateTitle}
                        size="xs"
                        gradientDuoTone="cyanToBlue"
                        disabled={!formData.content || aiGeneratingTitle}
                    >
                        {aiGeneratingTitle ? <Spinner size="sm" /> : "Generate Title"}
                    </Button>
                    <Select 
                        onChange={(e) => setFormData({...formData, category: e.target.value})} 
                        value={formData.category}
                    >
                        <option value='uncategorized'>Uncategorized</option>
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
                    <Button
                        type="button"
                        onClick={improveBlog}
                        gradientDuoTone="tealToLime"
                        disabled={!formData.content || aiImproving}
                        className="mt-2"
                    >
                        {aiImproving ? <Spinner size="sm" /> : "Improve Blog"}
                    </Button>
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

            {/* AI Improvement Preview Modal */}
            <Modal show={showAiPreview} onClose={rejectAiImprovement} size="7xl">
                <Modal.Header>AI Improved Content Options</Modal.Header>
                <Modal.Body>
                    <div className="space-y-6">
                        <Alert color="info">
                            Choose from the AI-improved content options below. Select your preferred version and click "Accept Improvement" to use it.
                        </Alert>
                        
                        <div className="space-y-6">
                            {/* Original Content */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">
                                    Original Content
                                </h3>
                                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 max-h-64 overflow-y-auto">
                                    <div 
                                        className="prose dark:prose-invert max-w-none text-sm"
                                        dangerouslySetInnerHTML={{ __html: originalContent }}
                                    />
                                </div>
                            </div>

                            {/* Improved Content Options */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 text-green-700 dark:text-green-300">
                                    AI Improved Content Options
                                </h3>
                                <div className="space-y-4">
                                    {aiImprovedContents.map((content, index) => (
                                        <div 
                                            key={index}
                                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                                selectedContentIndex === index 
                                                    ? 'bg-green-100 dark:bg-green-900/30 border-green-500' 
                                                    : 'bg-green-50 dark:bg-green-900/10 border-green-200 hover:bg-green-75 dark:hover:bg-green-900/20'
                                            }`}
                                            onClick={() => setSelectedContentIndex(index)}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0 ${
                                                    selectedContentIndex === index 
                                                        ? 'bg-green-500 border-green-500' 
                                                        : 'border-green-300'
                                                }`}>
                                                    {selectedContentIndex === index && (
                                                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="font-medium text-green-800 dark:text-green-200">
                                                            Version {index + 1}
                                                        </p>
                                                        <span className="text-xs text-green-600 dark:text-green-400">
                                                            {content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length} words
                                                        </span>
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto">
                                                        <div 
                                                            className="prose dark:prose-invert max-w-none text-sm text-green-700 dark:text-green-300"
                                                            dangerouslySetInnerHTML={{ __html: content }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <div className="flex gap-3 w-full justify-end">
                        <Button 
                            color="gray" 
                            onClick={rejectAiImprovement}
                            className="flex items-center gap-2"
                        >
                            <FaUndo />
                            Keep Original
                        </Button>
                        <Button 
                            gradientDuoTone="tealToLime" 
                            onClick={acceptAiImprovement}
                            className="flex items-center gap-2"
                            disabled={aiImprovedContents.length === 0}
                        >
                            <FaCheck />
                            Accept Selected Version
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>

            {/* AI Title Preview Modal */}
            <Modal show={showTitlePreview} onClose={rejectAiTitle} size="5xl">
                <Modal.Header>AI Generated Title Options</Modal.Header>
                <Modal.Body>
                    <div className="space-y-6">
                        <Alert color="info">
                            Choose from the AI-generated title options below. Select your preferred option and click "Accept Title" to use it.
                        </Alert>
                        
                        <div className="space-y-4">
                            {/* Original Title */}
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
                                    Current Title
                                </h3>
                                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {originalTitle || 'No title entered yet'}
                                    </p>
                                </div>
                            </div>

                            {/* Generated Title Options */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 text-green-700 dark:text-green-300">
                                    AI Generated Title Options
                                </h3>
                                <div className="space-y-3">
                                    {aiGeneratedTitles.map((title, index) => (
                                        <div 
                                            key={index}
                                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                                selectedTitleIndex === index 
                                                    ? 'bg-green-100 dark:bg-green-900/30 border-green-500' 
                                                    : 'bg-green-50 dark:bg-green-900/10 border-green-200 hover:bg-green-75 dark:hover:bg-green-900/20'
                                            }`}
                                            onClick={() => setSelectedTitleIndex(index)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0 ${
                                                    selectedTitleIndex === index 
                                                        ? 'bg-green-500 border-green-500' 
                                                        : 'border-green-300'
                                                }`}>
                                                    {selectedTitleIndex === index && (
                                                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-green-800 dark:text-green-200">
                                                        Option {index + 1}
                                                    </p>
                                                    <p className="text-green-700 dark:text-green-300 mt-1">
                                                        {title}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <div className="flex gap-3 w-full justify-end">
                        <Button 
                            color="gray" 
                            onClick={rejectAiTitle}
                            className="flex items-center gap-2"
                        >
                            <FaUndo />
                            Keep Original
                        </Button>
                        <Button 
                            gradientDuoTone="cyanToBlue" 
                            onClick={acceptAiTitle}
                            className="flex items-center gap-2"
                            disabled={aiGeneratedTitles.length === 0}
                        >
                            <FaCheck />
                            Accept Selected Title
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>
        </div>
    );
}