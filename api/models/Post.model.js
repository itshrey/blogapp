import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        title: {
            type: String, // Corrected typo from "tyoe" to "type"
            required: true,
            unique: true,
        },
        image: {
            type: String,
            default: 'https://imgs.search.brave.com/QbdXU3m1IXTlPUPNyFa1PeHXwb7aCWQswOND6q3tpuE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9kZXNp/Z253aXphcmQuY29t/L2Jsb2cvaG93LXRv/LW1ha2UtYS1nb29k/LXByZXNlbnRhdGlv/bi9yZXNpemUvcHJl/c2VudGF0aW9uXzE2/NTgzMDkxODA5NzJf/cmVzaXplLmpwZw',
        },
        category: {
            type: String,
            default: 'uncategorized',
        },
        slug: {
            type: String,
            required: true,
            unique: true,
        },
    },
    { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);

export default Post;
