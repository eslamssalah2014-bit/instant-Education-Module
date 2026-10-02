import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Search,
  Filter,
  BarChart3,
  Sparkles,
  Users2,
  Smile,
  Meh,
  Frown,
} from 'lucide-react';
import { api } from '../../services/api';
import { StudentFeedbackRecord, QualityMetric, Instructor, Track } from '../../types';

export const FeedbackQualityPage: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<StudentFeedbackRecord[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetric[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);

  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [fb, qm, instList, meta] = await Promise.all([
        api.getStudentFeedback(),
        api.getQualityMetrics(),
        api.getInstructors(),
        api.getMeta(),
      ]);
      setFeedbackList(fb);
      setQualityMetrics(qm);
      setInstructors(instList);
      setTracks(meta.tracks);
    } catch (err) {
      console.error('Failed to load feedback quality data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  let filtered = [...feedbackList];
  if (selectedTrack) filtered = filtered.filter((f) => f.trackId === selectedTrack);
  if (selectedSentiment) filtered = filtered.filter((f) => f.sentiment === selectedSentiment);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (f) =>
        f.instructorName.toLowerCase().includes(q) ||
        f.studentComments.toLowerCase().includes(q) ||
        f.groupName.toLowerCase().includes(q)
    );
  }

  const avgCsat =
    feedbackList.length > 0
      ? (feedbackList.reduce((s, f) => s + f.overallRating, 0) / feedbackList.length).toFixed(2)
      : '4.80';

  const positivePercent =
    feedbackList.length > 0
      ? Math.round(
          (feedbackList.filter((f) => f.sentiment === 'POSITIVE').length / feedbackList.length) * 100
        )
      : 85;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <MessageSquare className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Feedback & Quality Assurance
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Student satisfaction surveys, sentiment analysis, instructor feedback summaries, and academic quality assurance benchmarks.
          </p>
        </div>
      </div>

      {/* Institutional Quality KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {qualityMetrics.map((qm) => (
          <div
            key={qm.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {qm.title}
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {qm.value}
                {qm.title.includes('Rate') || qm.title.includes('Compliance') || qm.title.includes('Ratio')
                  ? '%'
                  : ''}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  qm.status === 'OPTIMAL'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                Target: {qm.target}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">{qm.change}</p>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student feedback comments or instructors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <select
          value={selectedTrack}
          onChange={(e) => setSelectedTrack(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="">All Academic Tracks</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSentiment}
          onChange={(e) => setSelectedSentiment(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="">All Sentiments</option>
          <option value="POSITIVE">Positive Feedback</option>
          <option value="NEUTRAL">Neutral Feedback</option>
          <option value="NEGATIVE">Requires Attention</option>
        </select>
      </div>

      {/* Feedback Feed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {item.instructorName}
                </h3>
                <div className="text-xs text-slate-500">
                  {item.groupName} • {item.trackName}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    item.sentiment === 'POSITIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : item.sentiment === 'NEUTRAL'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {item.sentiment === 'POSITIVE' && <Smile className="h-3.5 w-3.5" />}
                  {item.sentiment === 'NEUTRAL' && <Meh className="h-3.5 w-3.5" />}
                  {item.sentiment === 'NEGATIVE' && <Frown className="h-3.5 w-3.5" />}
                  {item.sentiment}
                </span>
              </div>
            </div>

            {/* Star Rating Breakdown */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs py-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
              <div>
                <span className="text-slate-400 block text-[10px]">Clarity</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  ★ {item.clarityRating.toFixed(1)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Engagement</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  ★ {item.engagementRating.toFixed(1)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Support</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  ★ {item.supportRating.toFixed(1)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Pacing</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  ★ {item.pacingRating.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Comment */}
            <blockquote className="text-sm italic text-slate-700 dark:text-slate-300 border-l-2 border-indigo-500 pl-3">
              "{item.studentComments}"
            </blockquote>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Overall Score: <strong className="text-slate-700 dark:text-slate-200">{item.overallRating.toFixed(1)}/5</strong></span>
              <span>Submitted: {item.submissionDate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
