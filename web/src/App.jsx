import React from 'react';
import {BrowserRouter,Navigate,Route,Routes} from 'react-router-dom';
import {AuthProvider,Protected} from './auth';
import {Footer,SiteHeader} from './components/UI';
import {Home,Courses,Login,Register} from './pages/Public';
import {StudentLayout,StudentDashboard,Profile,Application,Documents,Status} from './pages/Student';
import {AdminLayout,AdminDashboard,AdminApplications,AdminCourses,AdminReview} from './pages/Admin';
import {ManagementLayout,Management} from './pages/Management';
import CourseWiseReports from './pages/CourseWiseReports';
function NotFound(){return <div className="container missing"><h1>Page not found</h1><p>This page does not exist in CAMS.</p><a className="button" href="/">Back to homepage</a></div>}
export default function App(){return <BrowserRouter><AuthProvider><div className="app-root"><SiteHeader/><div className="app-content"><Routes>
<Route path="/" element={<Home/>}/><Route path="/courses" element={<Courses/>}/><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/>
<Route path="/student" element={<Protected role="STUDENT"><StudentLayout><StudentDashboard/></StudentLayout></Protected>}/>
<Route path="/student/profile" element={<Protected role="STUDENT"><StudentLayout><Profile/></StudentLayout></Protected>}/>
<Route path="/student/application" element={<Protected role="STUDENT"><StudentLayout><Application/></StudentLayout></Protected>}/>
<Route path="/student/documents" element={<Protected role="STUDENT"><StudentLayout><Documents/></StudentLayout></Protected>}/>
<Route path="/student/status" element={<Protected role="STUDENT"><StudentLayout><Status/></StudentLayout></Protected>}/>
<Route path="/admin" element={<Protected role="ADMIN"><AdminLayout><AdminDashboard/></AdminLayout></Protected>}/>
<Route path="/admin/courses" element={<Protected role="ADMIN"><AdminLayout><AdminCourses/></AdminLayout></Protected>}/>
<Route path="/admin/applications" element={<Protected role="ADMIN"><AdminLayout><AdminApplications/></AdminLayout></Protected>}/>
<Route path="/admin/applications/:id" element={<Protected role="ADMIN"><AdminLayout><AdminReview/></AdminLayout></Protected>}/>
<Route path="/management" element={<Protected role="MANAGEMENT"><ManagementLayout><Management/></ManagementLayout></Protected>}/>
<Route
  path="/management/reports"
  element={
    <Protected role="MANAGEMENT">
      <ManagementLayout>
        <CourseWiseReports />
      </ManagementLayout>
    </Protected>
  }
/>
<Route path="*" element={<NotFound/>}/>
</Routes></div><Footer/></div></AuthProvider></BrowserRouter>}
