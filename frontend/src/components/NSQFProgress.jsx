import React from 'react';

const NSQFProgress = ({ nsqfData, credentials = [] }) => {
  if (!nsqfData) {
    return null;
  }

  const {
    current_level = 0,
    max_level = 10,
    progress_percentage = 0,
    total_credits = 0,
    pathway_status = 'No NSQF credentials found',
    ncvet_credentials_count = 0
  } = nsqfData;

  const ncvetCredentials = credentials.filter(
    cred => cred.institute_info?.type === 'NCVET_VERIFIED'
  );

  const nonNcvetCredentials = credentials.filter(
    cred => cred.institute_info?.type === 'NON_NCVET'
  );

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getLevelDescription = (level) => {
    const descriptions = {
      1: 'Certificate (Class V)',
      2: 'Certificate (Class VIII)',
      3: 'Certificate (Class X)',
      4: 'Certificate (Class XII)',
      5: 'Certificate (Class XII + 1 year)',
      6: 'Diploma (Class XII + 2 years)',
      7: 'Advanced Diploma (Diploma + 1 year)',
      8: 'Bachelor Degree',
      9: 'Post Graduate Diploma',
      10: 'Master Degree'
    };
    return descriptions[level] || `Level ${level}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">NSQF Progress Tracker</h3>
        <div className="text-sm text-gray-500">
          National Skills Qualification Framework
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{current_level}</div>
          <div className="text-sm text-gray-600">Current NSQF Level</div>
          <div className="text-xs text-gray-500 mt-1">
            {current_level > 0 ? getLevelDescription(current_level) : 'No NSQF credentials'}
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{total_credits}</div>
          <div className="text-sm text-gray-600">Total Credits Earned</div>
          <div className="text-xs text-gray-500 mt-1">
            From {ncvet_credentials_count} NCVET credentials
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">{progress_percentage}%</div>
          <div className="text-sm text-gray-600">Qualification Progress</div>
          <div className="text-xs text-gray-500 mt-1">
            Towards next milestone
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">NSQF Level Progress</span>
          <span className="text-sm text-gray-500">{current_level}/{max_level}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(progress_percentage)}`}
            style={{ width: `${(current_level / max_level) * 100}%` }}
          ></div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <strong>Status:</strong> {pathway_status}
        </div>
      </div>

      {/* Qualification Pathway */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-3">Qualification Pathway</h4>
        <div className="space-y-2">
          {[
            { level: 4, name: 'Class XII Equivalent', required: 4 },
            { level: 6, name: 'Diploma Equivalent', required: 6 },
            { level: 8, name: 'Bachelor Degree Equivalent', required: 8 },
            { level: 10, name: 'Master Degree Equivalent', required: 10 }
          ].map((milestone) => (
            <div key={milestone.level} className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${
                current_level >= milestone.required 
                  ? 'bg-green-500' 
                  : current_level >= milestone.required - 2 
                    ? 'bg-yellow-500' 
                    : 'bg-gray-300'
              }`}></div>
              <span className={`text-sm ${
                current_level >= milestone.required 
                  ? 'text-green-700 font-medium' 
                  : 'text-gray-600'
              }`}>
                {milestone.name} (Level {milestone.required})
              </span>
              {current_level >= milestone.required && (
                <span className="text-xs text-green-600">✓ Achieved</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Credentials Breakdown */}
      <div className="border-t pt-4">
        <h4 className="text-md font-semibold text-gray-800 mb-3">Credentials Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">
                ✅ NCVET Verified
              </span>
              <span className="text-lg font-bold text-green-600">
                {ncvetCredentials.length}
              </span>
            </div>
            <div className="text-xs text-green-600 mt-1">
              Government recognized • NSQF aligned
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-800">
                ⚠️ Industry Platforms
              </span>
              <span className="text-lg font-bold text-yellow-600">
                {nonNcvetCredentials.length}
              </span>
            </div>
            <div className="text-xs text-yellow-600 mt-1">
              Market valuable • Non-NSQF
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      {current_level < 10 && (
        <div className="mt-4 bg-blue-50 rounded-lg p-4">
          <h5 className="text-sm font-semibold text-blue-800 mb-2">Next Steps</h5>
          <div className="text-sm text-blue-700">
            {current_level < 4 && (
              <p>• Complete more NCVET verified courses to reach Class XII equivalent</p>
            )}
            {current_level >= 4 && current_level < 6 && (
              <p>• Pursue diploma-level courses from NCVET verified institutes</p>
            )}
            {current_level >= 6 && current_level < 8 && (
              <p>• Consider bachelor degree programs or advanced diplomas</p>
            )}
            {current_level >= 8 && (
              <p>• Explore post-graduate programs for career advancement</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NSQFProgress;
