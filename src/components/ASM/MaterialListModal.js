import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
} from '@mui/material';

function MaterialListModal({ open, onClose, distributor }) {
  const materials = distributor.Materials || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Materials for {distributor.name}
      </DialogTitle>
      <DialogContent dividers>
        {materials.length > 0 ? (
          <List>
            {materials.map((material) => (
              <ListItem key={material.id}>
                <ListItemText
                  primary={`${material.name} (${material.code})`}
                  secondary={`Distributed Quantity: ${material.MaterialDistribution.distributedQuantity}`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body1">
            No distributed materials for this distributor.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default MaterialListModal;
