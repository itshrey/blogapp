import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const improveBlog = async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ success: false, message: 'Blog content is required.' });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'models/gemini-1.5-flash-latest'
    });
    

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Please improve the grammar, structure, and flow of the following blog content and give atleast 50 words:\n\n${content}`
            }
          ]
        }
      ]
    });

    const improvedText = result.response.text();

    res.status(200).json({
      success: true,
      improvedText
    });
  } catch (err) {
    console.error('Gemini Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gemini processing failed.',
      error: err.message
    });
  }
};


export const generateTitle = async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ success: false, message: 'Blog content is required.' });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'models/gemini-1.5-flash-latest'
    });

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Generate a short and engaging blog title for this content:\n\n${content}`
            }
          ]
        }
      ]
    });

    const title = result.response.text();

    res.status(200).json({
      success: true,
      title: title.trim()
    });
  } catch (err) {
    console.error('Gemini Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gemini title generation failed.',
      error: err.message
    });
  }
};



export const summarizeBlog = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "No content provided for summarization."
      });
    }

    const model = genAI.getGenerativeModel({
      model: "models/gemini-1.5-flash-latest" // or gemini-1.5-pro-latest if quota allows
    });

    const prompt = `
      Summarize the following blog content in 2-3 concise sentences for readers:
      
      "${content}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = await response.text();

    res.status(200).json({
      success: true,
      summary
    });

  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({
      success: false,
      message: "Gemini summarization failed.",
      error: error.message
    });
  }
};
