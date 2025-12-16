import { useState, useEffect } from 'react';

const SlideViewer = ({ slides, onStartPractice }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Convert Google Slides URL to embed format
  const convertToEmbedUrl = (url) => {
    if (!url) return '';
    
    // Extract presentation ID from various Google Slides URL formats
    let presentationId = '';
    
    // Format 1: https://docs.google.com/presentation/d/PRESENTATION_ID/edit
    // Format 2: https://docs.google.com/presentation/d/PRESENTATION_ID/preview
    // Format 3: https://docs.google.com/presentation/d/PRESENTATION_ID
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      presentationId = match[1];
    } else {
      // If it's already an embed URL or different format, try to extract ID
      const embedMatch = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
      if (embedMatch) {
        presentationId = embedMatch[1];
      }
    }
    
    if (!presentationId) {
      return url; // Return original URL if can't parse
    }
    
    // Return embed URL
    return `https://docs.google.com/presentation/d/${presentationId}/preview?rm=minimal&usp=sharing`;
  };

  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else if (currentSlideIndex === slides.length - 1 && onStartPractice) {
      // Nếu đang ở slide cuối và có nút làm bài tập, cho nút "Slide sau" bắt đầu phần bài tập
      onStartPractice();
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft' && currentSlideIndex > 0) {
        setCurrentSlideIndex(currentSlideIndex - 1);
      } else if (e.key === 'ArrowRight' && currentSlideIndex < slides.length - 1) {
        setCurrentSlideIndex(currentSlideIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlideIndex, slides.length]);

  // Handle touch/swipe gestures
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  if (!slides || slides.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Chưa có slide nào cho bài học này
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];
  const embedUrl = convertToEmbedUrl(currentSlide);

  const isLastSlide = currentSlideIndex === slides.length - 1;

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Slide Container - maximize height */}
      <div
        className="flex-1 relative bg-black rounded-xl overflow-hidden shadow-2xl mx-auto w-full"
        style={{ 
          minHeight: 0
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full border-0"
          allowFullScreen
          title={`Slide ${currentSlideIndex + 1}`}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Navigation hint + Practice Button */}
      <div className="flex-shrink-0 mt-3 space-y-2">
        {/* Navigation Hint */}
        <div className="text-center text-xs sm:text-sm font-semibold text-primary-600">
          💡 Dùng phím mũi tên ← → của bàn phím hoặc vuốt trái/phải trên slide để chuyển trang.
        </div>

        {/* Practice Button - only on last slide */}
        {isLastSlide && onStartPractice && (
          <div className="flex justify-center items-center">
            <button
              onClick={onStartPractice}
              className="px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-heading font-bold text-lg sm:text-2xl transition-all flex items-center space-x-3 bg-gradient-to-r from-action-400 to-action-500 text-white hover:from-action-500 hover:to-action-600 hover:shadow-2xl active:scale-95 shadow-xl transform hover:scale-105"
            >
              <span className="text-2xl">✏️</span>
              <span>Làm bài tập</span>
              <span className="text-2xl animate-pulse">→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlideViewer;

