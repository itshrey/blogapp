import React, { useState,useEffect } from 'react'
import { useSelector } from 'react-redux';
import { Link,useNavigate } from 'react-router-dom';
import {Alert,Modal, Button, Textarea} from 'flowbite-react'
import Comment from './Comment';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
export default function CommentSection({postId}) {
    const {currentUser} = useSelector(state=>state.user)
    const [comment,setComment]= useState('');
    const [comments,setComments]= useState([]);
    const [commentError,setCommentError]= useState(null);
    const [showModal,setShowModal]=useState(false);
    const [commentToDelete,setCommentToDelete]=useState(null);
    const navigate = useNavigate();
    const handleSubmit = async(e)=>{
        try { 
            e.preventDefault();
            if(comment.length > 200){
                setCommentError('Password must contain 200 words only.')
                return;
            }
            const res = await fetch('/api/comment/create',{
                method:'POST',
                headers:{
                    'Content-Type' : 'application/json',
                },
                body:JSON.stringify({postId,content:comment,userId:currentUser._id}),
            });
            const data = await res.json();
            if(res.ok){
                setComment('');
                setCommentError(null);
                setComments([data, ...comments]);
            }else{
                setCommentError(data.message)
            }
        } catch (error) {
            setCommentError(error.message)
        }
    }
    useEffect(()=>{
        const fetchComments= async()=>{
            try {
                const res=await fetch(`/api/comment/getPostComments/${postId}`);
                const data =await res.json();
                if(res.ok){
                    setComments(data);
                }else{
                    console.log(data.message)
                }
            } catch (error) {
                console.log(error.message)
            }
        }
        fetchComments();
    },[postId]);
    const handleLike = async(commentId) => {
        try {
            if(!currentUser){
                navigate('/sign-in');
                return;
            }
            const res = await fetch(`/api/comment/likeComment/${commentId}`,{
                method:'PUT',
            });
            if(res.ok){
                const data= await res.json();
                setComments(comments.map((comment)=>
                    comment._id === commentId ? {
                        ...comment,
                        likes:data.likes,
                        numberOfLikes: data.numberOfLikes,
                    } : comment
                ))
            }
        } catch (error) {
            console.log(error.message);
        }
    }
   const handleEdit = async(comment,editedComment)=>{
        setComments(comments.map((c)=>
            c._id===comment._id ? {...c,content: editedComment} : c
        ));
   };

   const handleDelete = async()=>{
    try {
        setShowModal(false);
        if(!currentUser){
            navigate('/sign-in');
            return;
        }
        const res = await fetch(`/api/comment/deleteComment/${commentToDelete}`,{
            method:'DELETE',
        });
        if(res.ok){
            const data= await res.json();
            setComments(comments.filter((comment)=> comment._id !== commentToDelete));
        }
    } catch (error) {
        console.log(error);
    }
   }


  return (
    <div className='max-w-2xl mx-auto w-full p-3'>{currentUser ? (
        <div className=' flex items-center gap-1 my-5 text-gray-500 text-sm'>
            <p>Signed in as: </p>
            <img className='h-5 w-5 object-cover rounded-full' src={currentUser.profilePicture} alt={currentUser.username} />
            <Link to={'/dashboard?tab=profile'} className='text-xs text-cyan-600 hover:underline' >
                @{currentUser.username}
            </Link>
        </div>
    ):(
        <div className='text-sm text-teal-500 my-5 flex gap-1'>
            You must be signed in to comment.
            <Link to={'/sign-in'} className=' text-blue-500 hover:underline'>Sign In</Link>
        </div>
         
    )}
    {
            currentUser && (
                <form  className='border border-teal-400 rounded-md p-3' onSubmit={handleSubmit}> 
                    <Textarea placeholder='Add a comment...'
                    rows='3' maxLength='200' onChange={(e)=>setComment(e.target.value)} value={comment}/>
                    <div className='flex justify-between items-center mt-5'>
                        <p className='text-gray-500 text-sm'>{200-comment.length} characters left</p>
                        <Button gradientDuoTone='purpleToBlue' type='submit' outline>Submit</Button>
                    </div>
                    {commentError &&(
                        <Alert color='failure' className='mt-5'>{commentError}</Alert>
                    )}
                </form> )}
                {comments.length===0 ? (
                    <p className='text-sm my-5'> No comments yet !</p>
                ):(
                    <>
                        <div className='text-sm my-5 flex gap-1 items-center'>
                            <p>Comments </p>
                                <div className='border border-gray-400 py-1 px-2 rounded-sm'>
                                    <p>{comments.length}</p>
                                </div>
                        </div>
                        {
                            comments.map((comment) =>(
                                <Comment key={comment._id} comment={comment} onLike={handleLike} onEdit={handleEdit} 
                                onDelete={(commentId)=>{
                                    setShowModal(true);
                                    setCommentToDelete(commentId);
                                }}/>
                            ))
                        }
                    </>
                )}
        <Modal show={showModal} onClose={()=>setShowModal(false)} popup size='md' >
          <Modal.Header />
          <Modal.Body>
            <div className='text-center'>
              <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mx-auto'/>
              <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>Are you sure you want to delete this comment ?</h3>
              <div className='flex items-center justify-center gap-5'>
                <Button color='failure' onClick={handleDelete}>
                  Yes, I'm sure
                </Button>
                <Button color='gray' onClick={()=>setShowModal(false)}>
                  No,cancel
                </Button>
              </div>
            </div>
          </Modal.Body>
        </Modal>
    </div>
  )
}
