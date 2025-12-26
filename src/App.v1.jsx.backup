import { useState, useEffect, useRef } from 'react';
import './App.css';
import DownloadCSVButton from './components/DownloadCSVButton';
import MapPreview from './components/MapPreview';
import Papa from 'papaparse';

import commonQuestions from './commonQuestions.json';
import fixedQuestions from './FixedQuestions.json';
import ConfirmationModal from './components/ConfirmationModal';

function App() {
  const [data, setData] = useState(() => {
    const savedData = localStorage.getItem('audioReviewData');
    console.log("Loading data from localStorage:", savedData ? JSON.parse(savedData) : []);
    return savedData ? JSON.parse(savedData) : [];
  });
  const [currentIndex, setCurrentIndex] = useState(() => {
    const savedCurrentIndex = localStorage.getItem('audioReviewCurrentIndex');
    console.log("Loading currentIndex from localStorage:", savedCurrentIndex ? JSON.parse(savedCurrentIndex) : 0);
    return savedCurrentIndex ? JSON.parse(savedCurrentIndex) : 0;
  });
  const [answers, setAnswers] = useState(() => {
    const savedAnswers = localStorage.getItem('audioReviewAnswers');
    console.log("Loading answers from localStorage:", savedAnswers ? JSON.parse(savedAnswers) : {});
    return savedAnswers ? JSON.parse(savedAnswers) : {};
  });
  const [playbackRate, setPlaybackRate] = useState(1);
  const [uploadSuccess, setUploadSuccess] = useState(() => {
    const savedUploadSuccess = localStorage.getItem('audioReviewUploadSuccess');
    return savedUploadSuccess ? JSON.parse(savedUploadSuccess) : false;
  });
  const [uploadedFileName, setUploadedFileName] = useState(() => {
    const savedUploadedFileName = localStorage.getItem('audioReviewUploadedFileName');
    return savedUploadedFileName ? JSON.parse(savedUploadedFileName) : '';
  });
  const audioRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessingNext, setIsProcessingNext] = useState(false);
  const [commonQuestionsBoxColor, setCommonQuestionsBoxColor] = useState('#e7f3ff');

  // Save state to localStorage whenever data, currentIndex, answers, uploadSuccess, or uploadedFileName change
  useEffect(() => {
    console.log("Saving data to localStorage:", data);
    console.log("Saving currentIndex to localStorage:", currentIndex);
    console.log("Saving answers to localStorage:", answers);
    console.log("Saving uploadSuccess to localStorage:", uploadSuccess);
    console.log("Saving uploadedFileName to localStorage:", uploadedFileName);
    localStorage.setItem('audioReviewData', JSON.stringify(data));
    localStorage.setItem('audioReviewCurrentIndex', JSON.stringify(currentIndex));
    localStorage.setItem('audioReviewAnswers', JSON.stringify(answers));
    localStorage.setItem('audioReviewUploadSuccess', JSON.stringify(uploadSuccess));
    localStorage.setItem('audioReviewUploadedFileName', JSON.stringify(uploadedFileName));
  }, [data, currentIndex, answers, uploadSuccess, uploadedFileName]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      Papa.parse(event.target.result, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed = results.data.map(row => {
            console.log("Raw row from papaparse:", row);
            console.log("Duration from raw row:", row['duration']);
            return {
              audio_link: row['audio_links'],
              campaign_name: row['campaign']?.trim(),
              contact_id: row['Contact_id'],
              contact_date: row['Contact_Date'],
              contact_start_time: row['Contact_Start_Time'],
              contact_end_time: row['Contact_end_time'],
              campaign_id: row['campaign_id'],
              contact_location: row['Contact_Location'],
              contact_duration: row['duration'],
            };
          }).filter(row => row.contact_id && row.audio_link && row.campaign_name);

          console.log("Parsed data:", parsed);
          setData(parsed);
          setCurrentIndex(0); // Reset index when new file is uploaded
          setAnswers({}); // Clear answers when new file is uploaded
          localStorage.setItem('audioReviewData', JSON.stringify(parsed));
          localStorage.setItem('audioReviewCurrentIndex', JSON.stringify(0));
          localStorage.setItem('audioReviewAnswers', JSON.stringify({}));
          setUploadSuccess(true);
          setUploadedFileName(file.name);
        }
      });
    };
    reader.readAsText(file);
  };

  const handleInputChange = (qIndex, value, type = 'common') => {
    const contactId = data[currentIndex].contact_id;
    const newAnswers = { ...answers };
    if (!newAnswers[contactId]) {
      newAnswers[contactId] = { common: [], fixed: [] };
    }
    if (type === 'common') {
      newAnswers[contactId].common[qIndex] = value;
    } else if (type === 'fixed') {
      newAnswers[contactId].fixed[qIndex] = value;
    }
    setAnswers(newAnswers);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (isProcessingNext) return; // Prevent multiple clicks

    setIsProcessingNext(true); // Start processing visual feedback

    if (currentIndex + 1 < data.length) {
      setCurrentIndex(currentIndex + 1);
      setCommonQuestionsBoxColor(prevColor =>
        prevColor === '#e7f3ff' ? '#e4f1e7ff' : '#e7f3ff'
      ); // Toggle color
      setTimeout(() => setIsProcessingNext(false), 300); // Reset after a short delay
    } else {
      alert("All users reviewed.");
      setIsProcessingNext(false); // Reset immediately if no next user
    }
  };

  const handleResetApp = () => {
    setShowModal(true);
    setModalStep(1);
  };

  const handleConfirmReset = () => {
    if (modalStep === 1) {
      setModalStep(2);
    } else if (modalStep === 2) {
      localStorage.removeItem('audioReviewData');
      localStorage.removeItem('audioReviewCurrentIndex');
      localStorage.removeItem('audioReviewAnswers');
      localStorage.removeItem('audioReviewUploadSuccess');
      localStorage.removeItem('audioReviewUploadedFileName');
      setData([]);
      setCurrentIndex(0);
      setAnswers({});
      setUploadSuccess(false);
      setUploadedFileName('');
      // Clear the file input
      document.querySelector('input[type="file"]').value = '';
      setShowModal(false);
      setModalStep(1);
    }
  };

  const handleCancelReset = () => {
    setShowModal(false);
    setModalStep(1);
  };

  const handleRewind = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime -= seconds;
    }
  };

  const handleForward = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const togglePlaybackSpeed = () => {
    setPlaybackRate(currentRate => {
      if (currentRate === 1) return 1.25;
      if (currentRate === 1.25) return 1.5;
      return 1;
    });
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const user = data[currentIndex];
  const userAnswers = answers[user?.contact_id] || {};

  const areAllQuestionsAnswered = () => {
    if (!user) return false; // No user data loaded

    // New condition: If the second option of the first common question is selected
    if (userAnswers.common?.[0] === commonQuestions[0].options[1] || userAnswers.common?.[0] === commonQuestions[0].options[2]) {
      return true; // Enable next button immediately
    }

    // Check common questions
    if (commonQuestions.length > 0) {
      for (let i = 0; i < commonQuestions.length; i++) {
        if (userAnswers.common?.[i] === undefined) {
          return false;
        }
      }
    }

    // Check fixed questions for the current campaign
    const currentFixedQuestions = fixedQuestions[user.campaign_id];
    if (currentFixedQuestions && currentFixedQuestions.length > 0) {
      for (let i = 0; i < currentFixedQuestions.length; i++) {
        if (userAnswers.fixed?.[i] === undefined) {
          return false;
        }
      }
    }

    return true;
  };

  const isNextButtonDisabled = !areAllQuestionsAnswered();

  return (
    <div className="App" style={{ padding: '20px' }}>
      <h1>Audio Review App</h1>

      <div className="upload-area">
        <div className="file-upload-container">
          <input type="file" accept=".csv" onChange={handleFileUpload} id="csv-upload" className="file-input" />
          <label htmlFor="csv-upload" className="file-upload-label">Choose File</label>
        </div>
        {uploadSuccess && <p className="upload-success-message">Upload successful: {uploadedFileName}</p>}
      </div>
      <br /><br />

      {user && (
        <div key={user.contact_id}> {/* Added key for better React rendering */}
          {console.log("Current user data:", user)} {/* Added console.log for debugging */}
          <div className='contact-map-container'>
            <div style={{
              border: '1px solid #ccc',
              padding: '15px',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9',
              width: '100%', /* Make it responsive */
              margin: '0' /* Align to left */
            }}>
              <h3 style={{ marginTop: '0' }}>Contact and Campaign Details</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}><strong>Contact ID:</strong></td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.contact_id}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}><strong>Contact Date:</strong></td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.contact_date}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}><strong>Contact Start Time:</strong></td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.contact_start_time}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}><strong>Contact End Time:</strong></td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.contact_end_time}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}><strong>Contact Duration:</strong></td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.contact_duration}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}><strong>Campaign ID:</strong></td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.campaign_id}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}><strong>Campaign Name:</strong></td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.campaign_name}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{
              border: '1px solid #ccc',
              padding: '15px',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9',
              width: '100%', /* Make it responsive */
              margin: '0' /* Align to left */
            }}>
              <h3 style={{ marginTop: '0' }}>Lat/Long Preview</h3>
              {user.contact_location && (() => {
                const [latStr, lngStr] = user.contact_location.split(',').map(s => s.trim());
                const lat = parseFloat(latStr);
                const lng = parseFloat(lngStr);
                return <MapPreview lat={lat} lng={lng} />;
              })()}
              {!user.contact_location && <p>No location data available.</p>}
            </div>
          </div>
          <h2>Audio: {currentIndex + 1}/{data.length}</h2>
          <div className="audio-player-container">
            <audio ref={audioRef} controls src={user.audio_link} playbackRate={playbackRate} className="audio-player"></audio>
            <button onClick={handlePlayPause} className="play-pause-button">{isPlaying ? 'Pause' : 'Play'}</button>
            <div className="audio-controls">
              <button onClick={() => handleRewind(5)}>Back 5s</button>
              <button onClick={() => handleForward(5)}>Next 5s</button>
              <button onClick={togglePlaybackSpeed} className={`speed-toggle-button ${playbackRate === 1.5 ? 'speed-1-5x-active' : (playbackRate !== 1 ? 'active-speed-button' : '')}`}>Current Speed: {playbackRate}x</button>
            </div>
          </div>
          
          {console.log("Audio Link:", user.audio_link)}

          <div style={{
            border: '4px solid #c5c7caff',
            padding: '20px',
            borderRadius: '8px',
            backgroundColor: commonQuestionsBoxColor, // Use the state variable here
            marginBottom: '30px'
          }}>
            <h3 style={{ marginTop: '0', color: '#0056b3' }}>Common Questions</h3>
            <form style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
              {commonQuestions.map((q, qIndex) => (
                <div key={qIndex}>
                  <label className="question-label" style={{ fontWeight: 'bold', marginBottom: '12px', display: 'block' }}>{q.question}</label>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {q.options.map((option, oIndex) => (
                      <div
                        key={oIndex}
                        className={`option-box ${userAnswers.common?.[qIndex] === option ? 'selected' : ''}`}
                        onClick={() => handleInputChange(qIndex, option, 'common')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '70px',    // Adjust this value to your desired fixed width
                          xheight: '60%',    // Adjust this value to your desired fixed height
                          padding: '10px 10px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          backgroundColor: userAnswers.common?.[qIndex] === option ? '#4B0082' : '#f0f0f0',
                          color: userAnswers.common?.[qIndex] === option ? 'white' : '#333',
                          border: userAnswers.common?.[qIndex] === option ? '1px solid #00567a ' : '1px solid #ccc',
                      }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </form>
          </div>

          {user && fixedQuestions[user.campaign_id] && (
            <div style={{
              border: '1px solid #28a745',
              padding: '20px',
              borderRadius: '8px',
              backgroundColor: '#e6ffe6',
              marginBottom: '30px'
            }}>
              <h3 style={{ marginTop: '0', color: '#155724' }}>Campaign Specific Questions (Campaign ID: {user.campaign_id})</h3>
              <form>
                {fixedQuestions[user.campaign_id].map((q, qIndex) => (
                  <div key={qIndex} style={{ marginBottom: '20px' }}>
                    <label className="question-label" style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>{q.question}</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {q.options.map((option, oIndex) => (
                        <div
                          key={oIndex}
                          className={`option-box ${userAnswers.fixed?.[qIndex] === option ? 'selected' : ''}`}
                          onClick={() => handleInputChange(qIndex, option, 'fixed')}
                          style={{
                            border: '1px solid #ccc',
                            padding: '10px 15px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                        backgroundColor: userAnswers.fixed?.[qIndex] === option ? '#4B0082' : '#f0f0f0',
                        color: userAnswers.fixed?.[qIndex] === option ? 'white' : '#333',
                        border: userAnswers.fixed?.[qIndex] === option ? '2px solid #3A0066' : '1px solid #ccc',
                        fontWeight: userAnswers.fixed?.[qIndex] === option ? 'bold' : 'normal',
                        transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, font-weight 0.3s ease'
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </form>
            </div>
          )}

          <div className="nav-buttons-container">
            <button onClick={handlePrevious} disabled={currentIndex === 0} className="nav-button previous-button">Previous</button>
            <button onClick={handleNext} className={`nav-button next-button ${isNextButtonDisabled || isProcessingNext ? 'next-button-disabled' : 'next-button-enabled'} ${isProcessingNext ? 'next-button-processing' : ''}`} disabled={isNextButtonDisabled || isProcessingNext}>
              {isProcessingNext ? 'Processing...' : 'Next'}
            </button>
          </div>
        </div>
      )}

      <hr style={{ margin: '40px 0' }} />

      
      <DownloadCSVButton savedAnswers={answers} userData={data} uploadedFileName={uploadedFileName} />
      <button onClick={handleResetApp} className="reset-button">Reset App</button>

      <footer style={{ marginTop: '50px', textAlign: 'center' }}>
      </footer>

      <ConfirmationModal
        message={modalStep === 1 ? "Are you sure you want to reset the application? All data will be lost." : "This will permanently delete all saved data. Are you absolutely sure?"}
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
        isVisible={showModal}
        modalStep={modalStep}
      />
    </div>
  );
}

export default App;

