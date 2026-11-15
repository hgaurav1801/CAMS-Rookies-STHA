
import React, { useEffect, useState } from "react";
import { api, msg } from "../api";
import { Page, Stat, Spinner, Alert } from "../components/UI";

export default function CourseWiseReports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState("all");

  useEffect(() => {
    let active = true;

    api("/api/management/reports")
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) setError(msg(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const allCourses = data?.by_course || [];

  const courses =
    selectedCourse === "all"
      ? allCourses
      : allCourses.filter((c) => c.id === selectedCourse);

  const number = (value) => Number(value) || 0;

  const total = (key) =>
    courses.reduce((sum, course) => sum + number(course[key]), 0);

  const capacity = total("seat_capacity");
  const approved = total("approved");
  const remaining = Math.max(0, capacity - approved);

  const percentage = (part, whole) =>
    whole > 0 ? Math.round((part / whole) * 100) : 0;

  return (
    <Page
      eyebrow="COLLEGE MANAGEMENT"
      title="Course-wise admission reports"
      description="Detailed admission statistics, seat availability and course utilisation."
      actions={
        <select
          aria-label="Filter by course"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="all">All courses</option>
          {allCourses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      }
    >
      {loading ? (
        <Spinner />
      ) : (
        <>
          <Alert error={error} />

          {data && (
            <>
              {/* Summary cards */}
              <div className="stat-grid">
                <Stat
                  label="Total courses"
                  value={courses.length}
                />
                <Stat
                  label="Approved admissions"
                  value={approved}
                />
                <Stat
                  label="Available seats"
                  value={remaining}
                />
              </div>

              {/* Course-wise data table */}
              <div className="card">
                <h2>Detailed admission statistics</h2>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Capacity</th>
                        <th>Applications</th>
                        <th>Approved</th>
                        <th>Rejected</th>
                        <th>In Review</th>
                        <th>Available</th>
                        <th>Occupancy</th>
                      </tr>
                    </thead>

                    <tbody>
                      {courses.map((course) => {
                        const cap = number(course.seat_capacity);
                        const used = number(course.approved);

                        return (
                          <tr key={course.id}>
                            <td>
                              <strong>{course.name}</strong>
                            </td>
                            <td>{cap}</td>
                            <td>{number(course.applications)}</td>
                            <td>{used}</td>
                            <td>{number(course.rejected)}</td>
                            <td>{number(course.under_review)}</td>
                            <td>{Math.max(0, cap - used)}</td>
                            <td>{percentage(used, cap)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>

                    <tfoot>
                      <tr>
                        <td><strong>Total</strong></td>
                        <td>{capacity}</td>
                        <td>{total("applications")}</td>
                        <td>{approved}</td>
                        <td>{total("rejected")}</td>
                        <td>{total("under_review")}</td>
                        <td>{remaining}</td>
                        <td>{percentage(approved, capacity)}%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Seat utilisation graph */}
              <div className="card">
                <h2>Seat utilisation by course</h2>

                <div className="status-rows">
                  {courses.map((course) => {
                    const cap = number(course.seat_capacity);
                    const used = number(course.approved);
                    const pct = percentage(used, cap);

                    return (
                      <div
                        className="distribution"
                        key={course.id}
                      >
                        <span>{course.name}</span>

                        <div
                          className="bar"
                          role="progressbar"
                          aria-label={`${course.name} seat occupancy`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={pct}
                        >
                          <div style={{ width: `${pct}%` }} />
                        </div>

                        <strong>{pct}%</strong>
                      </div>
                    );
                  })}
                </div>

                <p className="fine-print">
                  Seat utilisation = Approved admissions /
                  Total course capacity × 100.
                </p>
              </div>

              <p className="fine-print">
                Rookies–STHA academic demonstration.
                Management reports are read-only.
              </p>
            </>
          )}
        </>
      )}
    </Page>
  );
}
