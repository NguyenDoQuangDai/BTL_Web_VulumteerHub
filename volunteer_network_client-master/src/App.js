import React from 'react';
import Header from './Components/Header/Header';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Home from './Components/Home/Home';
import Tasks from './Components/Tasks/Tasks';
import Login from './Components/Login/Login';
import Footer from './Components/Footer/Footer';
import NoMatch from './Components/NoMatch/NoMatch';
import TaskRegistration from './Components/TaskRegistration/TaskRegistration';
import PrivateRoute from './Components/PrivateRoute/PrivateRoute';
import UserDashboard from './Components/UserDashboard/UserDashboard';
import SearchResult from './Components/SearchResult/SearchResult';
import AdminDashboard from './Pages/Admin/AdminDashboard';
import AdminEvent from './Pages/Admin/AddEvent';
import ManageUsersDashboard from './Pages/Admin/ManageUsersDashboard';
import ManageEventsDashboard from './Pages/Admin/ManageEventsDashboard';
import EventsPage from './Pages/Events/EventsPage';
import EventChannelPage from './Pages/EventChannel/EventChannelPage';
import Forum from './Components/Forum/Forum';
import Unauthorized from './Components/Unauthorized/Unauthorized';
import { AuthProvider } from './contexts/AuthContext';

// ========================================================================================

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* <Header /> */}
        <Switch>
          <Route exact path='/home'>
            <div className="d-flex flex-column min-vh-100">
              <Header />
              <div className="flex-grow-1">
                <Home />
              </div>
              <Footer />
            </div>
          </Route>

          <Route exact path='/login'>
            <Login />
          </Route>

          <PrivateRoute path='/events/:id'>
            <TaskRegistration />
          </PrivateRoute>

          <Route exact path='/events'>
            <EventsPage />
          </Route>

          <Route path='/event/:id'>
            <EventChannelPage />
          </Route>

          <Route exact path='/forum'>
            <Forum />
          </Route>

          <PrivateRoute exact path='/userDashboard'>
            <Header />
            <UserDashboard />
          </PrivateRoute>

          <Route exact path='/admin/dashboard'>
            <AdminDashboard />
          </Route>

          <Route exact path='/admin/addEvent'>
            <AdminEvent />
          </Route>

          <Route exact path='/admin/events'>
            <ManageEventsDashboard />
          </Route>

          <Route exact path='/admin/users'>
            <ManageUsersDashboard />
          </Route>

          <Route exact path='/admin/registrations'>
            <AdminDashboard />
          </Route>

          <Route exact path='/unauthorized'>
            <Header />
            <Unauthorized />
          </Route>

          <Route path='/search=:searchQuery'>
            <Header />
            <Home />
            <SearchResult />
            <Footer />
          </Route>

          <Route exact path='/'>
            <div className="d-flex flex-column min-vh-100">
              <Header />
              <div className="flex-grow-1">
                <Home />
              </div>
              <Footer />
            </div>
          </Route>

          <Route path='*'>
            <Header />
            <NoMatch />
          </Route>
        </Switch>
      </Router>
    </AuthProvider>
  );
}

export default App;
