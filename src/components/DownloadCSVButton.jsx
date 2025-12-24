import React from 'react';
import commonQuestions from '../commonQuestions.json';
import fixedQuestions from '../FixedQuestions.json';

const DownloadCSVButton = ({ savedAnswers, userData, uploadedFileName }) => {

  const handleDownloadCSV = () => {
    const commonQuestionTexts = commonQuestions.map(q => q.question);

    // Collect all unique fixed questions across all campaigns
    let allFixedQuestionTexts = [];
    for (const campaignId in fixedQuestions) {
      fixedQuestions[campaignId].forEach(q => {
        if (!allFixedQuestionTexts.includes(q.question)) {
          allFixedQuestionTexts.push(q.question);
        }
      });
    }
    allFixedQuestionTexts.sort(); // Sort to ensure consistent header order

    const headers = ['contact_id', 'campaign_name', 'audio_link', ...commonQuestionTexts, ...allFixedQuestionTexts];
    let csvContent = "\uFEFF" + headers.map(header => `"${header.replace(/"/g, '""')}"`).join(',') + '\n';

    userData.forEach(user => {
      const contactId = user.contact_id;
      const campaignName = user.campaign_name;
      const audioLink = user.audio_link;
      const userAnswers = savedAnswers[contactId] || {};
      const commonUserAnswers = userAnswers.common || [];
      const fixedUserAnswers = userAnswers.fixed || [];

      const row = [contactId, campaignName, audioLink];

      // Add common answers
      commonQuestionTexts.forEach((q, index) => {
        row.push(commonUserAnswers[index] !== undefined ? commonUserAnswers[index] : '');
      });

      // Add fixed answers
      const currentFixedQuestions = fixedQuestions[user.campaign_id] || [];
      const fixedAnswerMap = {};
      currentFixedQuestions.forEach((q, index) => {
        fixedAnswerMap[q.question] = fixedUserAnswers[index] !== undefined ? fixedUserAnswers[index] : '';
      });

      allFixedQuestionTexts.forEach(fixedQText => {
        row.push(fixedAnswerMap[fixedQText] !== undefined ? fixedAnswerMap[fixedQText] : '');
      });

      csvContent += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // Feature detection for download attribute
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      let baseFileName = uploadedFileName.replace(/\.csv$/i, ''); // Remove .csv extension if present
      const newFileName = `${baseFileName}_answers.csv`;
      link.setAttribute('download', newFileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up the URL object
    } else {
      // Fallback for browsers that don't support the download attribute
      alert('Your browser does not support automatic file downloads. Please save the content manually.');
      // You might open a new window with the CSV content here for manual copy/paste
      // window.open('data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    }
  };

  return (
    <div>
      <h1>Review Answers</h1>
      <button onClick={handleDownloadCSV}>Download Review Answers CSV</button>
      <p>
        This button will generate a CSV file named `rreview_answers.csv`
        containing user IDs, campaign names, and their saved answers.
      </p>
      
    </div>
  );
};

export default DownloadCSVButton;
