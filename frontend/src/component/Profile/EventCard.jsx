import {
  Card,
  CardActions,
  CardContent,
  CardMedia,
  IconButton,
  Typography,
} from "@mui/material";
import React from "react";
import dayjs from 'dayjs';
import DeleteIcon from "@mui/icons-material/Delete";

export const EventCard = ({ event = {}, canDelete = false, onDelete, onNavigate }) => {
  const image = event.image || "https://cdn.pixabay.com/photo/2020/12/17/00/50/food-5838035_1280.jpg";
  const title = event.name || event.title || "Unnamed Event";
  const description = event.description || event.subtitle || "";
  const location = event.location || event.city || "Unknown";
  const startRaw = event.startedAt || event.start || event.startDate || null;
  const endRaw = event.endsAt || event.end || event.endDate || null;
  const start = startRaw ? dayjs(startRaw).format('MMM D, YYYY h:mm A') : null;
  const end = endRaw ? dayjs(endRaw).format('MMM D, YYYY h:mm A') : null;

  const handleClick = () => {
    if (onNavigate) onNavigate(event);
  };

  return (
    <div>
      <Card sx={{ width: 345, cursor: onNavigate ? 'pointer' : 'default' }} onClick={handleClick}>
        <CardMedia sx={{ height: 345 }} image={image} />
        <CardContent>
          <Typography variant="h5">{title}</Typography>
          {description && <Typography variant="body2">{description}</Typography>}
          <div className="py-2 space-y-2">
            <p>{location}</p>
            {start && <p className="text-sm text-blue-500">{start}</p>}
            {end && <p className="text-sm text-blue-500">{end}</p>}
          </div>
        </CardContent>
        {canDelete && (
          <CardActions>
            <IconButton onClick={() => onDelete && onDelete(event.id)} aria-label="delete-event">
              <DeleteIcon />
            </IconButton>
          </CardActions>
        )}
      </Card>
    </div>
  );
};
