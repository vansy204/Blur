// StoryModal.js
import React, { useEffect, useState, useRef } from "react";

const StoryModal = ({ isOpen, onClose, stories }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (isOpen) {
      timerRef.current = setTimeout(() => {
        if (currentIndex < stories.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          onClose(); // đóng modal khi hết story
        }
      }, 5000); // 5 giây mỗi story

      return () => clearTimeout(timerRef.current);
    }
  }, [currentIndex, isOpen, onClose, stories.length]);

  const handleNext = () => {
    clearTimeout(timerRef.current);
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    clearTimeout(timerRef.current);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
      <div className="bg-black rounded-xl relative max-w-sm w-full">
        {/* Close Button */}
        <button
          className="absolute top-2 right-2 text-white bg-black rounded-full w-8 h-8 z-10"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 px-2 pt-2 z-10">
          {stories.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full bg-white/30 overflow-hidden`}
            >
              <div
                className={`h-full bg-white transition-all duration-[5000ms] ${
                  idx === currentIndex ? "w-full" : idx < currentIndex ? "w-full" : "w-0"
                }`}
              ></div>
            </div>
          ))}
        </div>

        {/* Content */}
        {currentStory.type === "image" ? (
          <img
            src={currentStory.url}
            alt="story"
            className="w-full h-[500px] object-cover rounded-xl"
          />
        ) : (
          <video
            src={currentStory.url}
            className="w-full h-[500px] object-cover rounded-xl"
            autoPlay
            muted
          />
        )}

        {/* Controls */}
        <div className="absolute top-0 left-0 h-full w-1/2" onClick={handlePrev} />
        <div className="absolute top-0 right-0 h-full w-1/2" onClick={handleNext} />
      </div>
    </div>
  );
};

export default StoryModal;
